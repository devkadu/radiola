-- Scoped security/privacy changes. Validate against isolated fixtures before applying.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create schema if not exists radiola_private;
revoke all on schema radiola_private from public, anon;

-- A display name never falls back to an email address.
create or replace function radiola_private.public_username(p_metadata jsonb, p_user_id uuid)
returns text language sql immutable set search_path = '' as $$
  select coalesce(
    case when pg_catalog.jsonb_typeof(p_metadata -> 'username') = 'string'
      then nullif(pg_catalog.left(pg_catalog.btrim(p_metadata ->> 'username',
        U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'), 80), '')
    end,
    'usuario-' || pg_catalog.left(pg_catalog.replace(p_user_id::text, '-', ''), 12)
  );
$$;
revoke all on function radiola_private.public_username(jsonb, uuid) from public, anon, authenticated;

create or replace function radiola_private.public_avatar(p_metadata jsonb)
returns text language sql immutable set search_path = '' as $$
  select case when pg_catalog.jsonb_typeof(p_metadata -> 'avatar_url') = 'string'
    and pg_catalog.length(p_metadata ->> 'avatar_url') <= 2048
    and p_metadata ->> 'avatar_url' ~ '^https://'
    then p_metadata ->> 'avatar_url' else null end;
$$;
revoke all on function radiola_private.public_avatar(jsonb) from public, anon, authenticated;

-- This SECURITY DEFINER is narrowly scoped to the caller's own account state.
-- It allows pending erasures/bans to block existing JWTs before deleting Storage/Auth.
create or replace function radiola_private.is_active_account()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users u where u.id = auth.uid()
      and (u.banned_until is null or u.banned_until < pg_catalog.now())
      and (u.raw_app_meta_data ->> 'privacy_erasure_pending') is distinct from 'true'
  );
$$;
revoke all on function radiola_private.is_active_account() from public, anon;
grant usage on schema radiola_private to authenticated;
grant execute on function radiola_private.is_active_account() to authenticated;

do $$
declare target text;
begin
  foreach target in array array['comments','trailer_comments','episode_reactions','episode_likes',
    'follows','watched_episodes','user_series','user_lists','user_list_series'] loop
    execute pg_catalog.format('create policy active_account_required on public.%I as restrictive for all to authenticated using ((select radiola_private.is_active_account())) with check ((select radiola_private.is_active_account()))', target);
  end loop;
end;
$$;
create policy active_account_storage on storage.objects as restrictive for all to authenticated
  using ((select radiola_private.is_active_account()))
  with check ((select radiola_private.is_active_account()));

-- Trigger-only privileged lookup: authors cannot supply identity, likes or timestamps.
create or replace function radiola_private.prepare_public_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare author_metadata jsonb; parent_episode text;
begin
  if auth.uid() is not null and auth.uid() is distinct from new.user_id then
    raise exception 'Comment author mismatch' using errcode = '42501';
  end if;
  if auth.uid() is null and coalesce(pg_catalog.current_setting('role', true), 'none')
    not in ('none', 'postgres', 'service_role') then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select u.raw_user_meta_data into author_metadata from auth.users u
    where u.id = new.user_id
      and (u.banned_until is null or u.banned_until < pg_catalog.now())
      and (u.raw_app_meta_data ->> 'privacy_erasure_pending') is distinct from 'true';
  if not found then raise exception 'Author unavailable' using errcode = '42501'; end if;
  new.username := radiola_private.public_username(author_metadata, new.user_id);
  new.avatar_url := radiola_private.public_avatar(author_metadata);
  new.likes := 0;
  new.created_at := pg_catalog.statement_timestamp();
  new.text := pg_catalog.btrim(new.text);
  if tg_table_name = 'comments' and new.parent_id is not null then
    select p.episode_id into parent_episode from public.comments p where p.id = new.parent_id for key share;
    if not found or parent_episode is distinct from new.episode_id then
      raise exception 'Reply must belong to the same discussion' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function radiola_private.prepare_public_comment() from public, anon, authenticated;
create trigger prepare_public_comment before insert on public.comments
  for each row execute function radiola_private.prepare_public_comment();
-- trailer_comments has no parent_id: use a separate trigger record wrapper below.
create or replace function radiola_private.prepare_trailer_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare author_metadata jsonb;
begin
  if auth.uid() is not null and auth.uid() is distinct from new.user_id then
    raise exception 'Comment author mismatch' using errcode = '42501';
  end if;
  if auth.uid() is null and coalesce(pg_catalog.current_setting('role', true), 'none')
    not in ('none', 'postgres', 'service_role') then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select u.raw_user_meta_data into author_metadata from auth.users u
    where u.id = new.user_id
      and (u.banned_until is null or u.banned_until < pg_catalog.now())
      and (u.raw_app_meta_data ->> 'privacy_erasure_pending') is distinct from 'true';
  if not found then raise exception 'Author unavailable' using errcode = '42501'; end if;
  new.username := radiola_private.public_username(author_metadata, new.user_id);
  new.avatar_url := radiola_private.public_avatar(author_metadata);
  new.likes := 0;
  new.created_at := pg_catalog.statement_timestamp();
  new.text := pg_catalog.btrim(new.text);
  return new;
end;
$$;
revoke all on function radiola_private.prepare_trailer_comment() from public, anon, authenticated;
create trigger prepare_trailer_comment before insert on public.trailer_comments
  for each row execute function radiola_private.prepare_trailer_comment();

alter table public.comments add constraint comments_content_bounds
  check (char_length(btrim(text)) between 1 and 2000 and char_length(btrim(episode_id)) between 1 and 200) not valid;
alter table public.comments add constraint comments_no_self_reply check (parent_id is distinct from id) not valid;
alter table public.trailer_comments add constraint trailer_comments_content_bounds
  check (char_length(btrim(text)) between 1 and 2000 and timestamp_sec >= 0
    and char_length(series_id) between 1 and 200 and char_length(youtube_key) between 1 and 100) not valid;
-- Preserve the four named reactions already present in the live catalog.
alter table public.episode_reactions add constraint episode_reactions_value_bounds
  check (reaction_key in ('1','2','3','4','5','emocionante','incrivel','surpreso','chocante')
    and char_length(episode_id) between 1 and 200) not valid;
alter table public.follows add constraint follows_no_self_follow check (follower_id <> following_id) not valid;

-- Preserve other users' replies and a minimal report record when a comment/account is deleted.
alter table public.comments drop constraint comments_parent_id_fkey;
alter table public.comments add constraint comments_parent_id_fkey
  foreign key (parent_id) references public.comments(id) on delete set null;
alter table public.moderation_queue drop constraint moderation_queue_comment_id_fkey;
alter table public.moderation_queue add constraint moderation_queue_comment_id_fkey
  foreign key (comment_id) references public.comments(id) on delete set null;
alter table public.moderation_queue drop constraint moderation_queue_reported_by_fkey;
alter table public.moderation_queue add constraint moderation_queue_reported_by_fkey
  foreign key (reported_by) references auth.users(id) on delete set null;

create or replace function public.moderate_comment(p_report_id uuid, p_comment_id uuid, p_action text)
returns void language plpgsql security invoker set search_path = '' as $$
declare reported_comment uuid;
begin
  if p_action is null or p_action not in ('dismiss','delete') then
    raise exception 'Invalid moderation action' using errcode = '22023';
  end if;
  -- All deletions take the comment lock first, avoiding inverted locks across reports.
  perform 1 from public.comments where id = p_comment_id for update;
  select comment_id into reported_comment from public.moderation_queue where id = p_report_id for update;
  if not found then raise exception 'Report not found' using errcode = 'P0002'; end if;
  if reported_comment is distinct from p_comment_id then
    raise exception 'Report does not match comment' using errcode = '22023';
  end if;
  if p_action = 'delete' then
    update public.moderation_queue set status = 'actioned' where comment_id = p_comment_id and status = 'pending';
    update public.moderation_queue set status = 'actioned' where id = p_report_id;
    delete from public.comments where id = p_comment_id;
  else
    update public.moderation_queue set status = 'reviewed' where id = p_report_id;
  end if;
end;
$$;
revoke all on function public.moderate_comment(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.moderate_comment(uuid,uuid,text) to service_role;
revoke all on public.moderation_queue, public.admin_highlights from public, anon, authenticated;

-- Auth owns the source identity. Keep the private lookup and existing publications in sync.
create or replace function radiola_private.sync_profile_directory()
returns trigger language plpgsql security definer set search_path = '' as $$
declare public_name text; public_photo text;
begin
  public_name := radiola_private.public_username(new.raw_user_meta_data, new.id);
  public_photo := radiola_private.public_avatar(new.raw_user_meta_data);
  insert into public.profile_directory(user_id, username, created_at)
    values(new.id, public_name, coalesce(new.created_at, pg_catalog.now()))
    on conflict(user_id) do update set username = excluded.username
      where public.profile_directory.username is distinct from excluded.username;
  update public.comments set username = public_name, avatar_url = public_photo where user_id = new.id
    and (username is distinct from public_name or avatar_url is distinct from public_photo);
  update public.trailer_comments set username = public_name, avatar_url = public_photo where user_id = new.id
    and (username is distinct from public_name or avatar_url is distinct from public_photo);
  return new;
end;
$$;
revoke all on function radiola_private.sync_profile_directory() from public, anon, authenticated;
insert into public.profile_directory(user_id, username, created_at)
  select id, radiola_private.public_username(raw_user_meta_data,id), coalesce(created_at,pg_catalog.now()) from auth.users
  on conflict(user_id) do update set username = excluded.username;
update public.comments c set username = radiola_private.public_username(u.raw_user_meta_data,u.id),
  avatar_url = radiola_private.public_avatar(u.raw_user_meta_data)
  from auth.users u where c.user_id = u.id;
update public.trailer_comments c set username = radiola_private.public_username(u.raw_user_meta_data,u.id),
  avatar_url = radiola_private.public_avatar(u.raw_user_meta_data)
  from auth.users u where c.user_id = u.id;

-- Prevent two accounts from sharing a public identity or linking comments to a namesake.
-- The live preflight confirmed there are no conflicting names.
create unique index profile_directory_username_unique_idx on public.profile_directory (lower(username));

-- Operational tooling refuses erasure until this complete transaction is installed.
create or replace function public.privacy_tools_version()
returns integer language sql immutable security invoker set search_path = '' as $$ select 1; $$;
revoke all on function public.privacy_tools_version() from public, anon, authenticated;
grant execute on function public.privacy_tools_version() to service_role;

-- Ranking function definitions follow; keep them SECURITY INVOKER and backend-only.

CREATE OR REPLACE FUNCTION public.get_trending_seasons()
 RETURNS TABLE("seriesId" text, season integer, score bigint)
 LANGUAGE sql
 SET search_path = ''
AS $function$
  select
    split_part(episode_id, '-s', 1) as "seriesId",
    case when length(split_part(split_part(episode_id, '-s', 2), '-e', 1)) <= 9
      then split_part(split_part(episode_id, '-s', 2), '-e', 1)::int end as season,
    count(*) as score
  from (
    select episode_id from public.comments
      where created_at > now() - interval '7 days'
    union all
    select episode_id from public.episode_reactions
      where created_at > now() - interval '7 days'
    union all
    select episode_id from public.watched_episodes
      where watched_at > now() - interval '7 days'
  ) t
  where episode_id ~ '^\d+-s\d+-e\d+$'
    and length(split_part(split_part(episode_id, '-s', 2), '-e', 1)) <= 9
  group by "seriesId", season
  order by score desc
  limit 6;
$function$;
revoke execute on function public.get_trending_seasons() from public, anon, authenticated;
grant execute on function public.get_trending_seasons() to service_role;

CREATE OR REPLACE FUNCTION public.popular_series()
 RETURNS TABLE(series_id integer, favorite_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path = ''
AS $function$
  select
    series_id,
    count(*) as favorite_count
  from public.user_series
  group by series_id
  order by favorite_count desc
  limit 20;
$function$;
revoke execute on function public.popular_series() from public, anon, authenticated;
grant execute on function public.popular_series() to service_role;

create or replace function public.get_top_commenters_7days()
returns table(user_id text, username text, avatar_url text, comments bigint)
language sql stable security invoker set search_path = '' as $function$
 select c.user_id::text, max(c.username), max(c.avatar_url), count(*)
 from public.comments c
 where c.created_at > now() - interval '7 days'
 group by c.user_id order by count(*) desc, c.user_id limit 4;
$function$;
revoke execute on function public.get_top_commenters_7days() from public, anon, authenticated;
grant execute on function public.get_top_commenters_7days() to service_role;

CREATE OR REPLACE FUNCTION public.hot_episodes()
 RETURNS TABLE(episode_id text, comment_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path = ''
AS $function$
  select
    episode_id,
    count(*) as comment_count
  from public.comments
  where created_at >= now() - interval '7 days'
  group by episode_id
  order by comment_count desc
  limit 6;
$function$;
revoke execute on function public.hot_episodes() from public, anon, authenticated;
grant execute on function public.hot_episodes() to service_role;

CREATE OR REPLACE FUNCTION public.hot_episodes_by_series(series_ids integer[])
 RETURNS TABLE(episode_id text, comment_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path = ''
AS $function$
  select episode_id, count(*) as comment_count
  from public.comments
  where case when episode_id ~ '^\d+-s\d+-e\d+$'
    then split_part(episode_id, '-s', 1)::numeric = any(series_ids)
    else false end
  group by episode_id
  order by comment_count desc
  limit 4;
$function$;
revoke execute on function public.hot_episodes_by_series(integer[]) from public, anon, authenticated;
grant execute on function public.hot_episodes_by_series(integer[]) to service_role;

commit;

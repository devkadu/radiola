-- Synthetic database only. No connection string or production data is used.
create role anon;
create role authenticated;
create role service_role bypassrls;
create schema auth;
create schema storage;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid;
$$;
create table auth.users (
  id uuid primary key, email text, raw_user_meta_data jsonb default '{}',
  raw_app_meta_data jsonb default '{}', banned_until timestamptz, created_at timestamptz default now()
);
create table public.profile_directory (
  user_id uuid primary key references auth.users on delete cascade,
  username text not null, created_at timestamptz not null
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), episode_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  username text not null, avatar_url text, text text not null, likes integer default 0,
  created_at timestamptz default now(), parent_id uuid,
  constraint comments_parent_id_fkey foreign key(parent_id) references public.comments on delete cascade
);
create table public.trailer_comments (
  id uuid primary key default gen_random_uuid(), series_id text not null, youtube_key text not null,
  user_id uuid not null references auth.users on delete cascade, username text not null,
  avatar_url text, timestamp_sec integer not null, text text not null,
  likes integer not null default 0, created_at timestamptz not null default now()
);
create table public.episode_reactions (
  id uuid primary key default gen_random_uuid(), episode_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  reaction_key text not null, created_at timestamptz default now(), unique(episode_id,user_id)
);
create table public.episode_likes (
  id uuid primary key default gen_random_uuid(), episode_id text not null,
  user_id uuid not null references auth.users on delete cascade, created_at timestamptz default now()
);
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users on delete cascade,
  following_id uuid references auth.users on delete cascade, created_at timestamptz default now()
);
create table public.watched_episodes (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
  episode_id text, watched_at timestamptz default now()
);
create table public.user_series (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade, series_id integer
);
create table public.user_lists (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text
);
create table public.user_list_series (
  id uuid primary key default gen_random_uuid(), list_id uuid references public.user_lists on delete cascade, series_id integer
);
create table public.moderation_queue (
  id uuid primary key default gen_random_uuid(), comment_id uuid,
  reported_by uuid, reason text, status text not null default 'pending',
  constraint moderation_queue_comment_id_fkey foreign key(comment_id) references public.comments on delete cascade,
  constraint moderation_queue_reported_by_fkey foreign key(reported_by) references auth.users
);
create table public.admin_highlights(id uuid primary key default gen_random_uuid());
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
grant all on all tables in schema public, auth, storage to service_role;
grant select, insert, update, delete on all tables in schema public, storage to anon, authenticated;
revoke all on public.profile_directory from anon, authenticated;
do $$
declare target text;
begin
  foreach target in array array['profile_directory','comments','trailer_comments','episode_reactions','episode_likes',
    'follows','watched_episodes','user_series','user_lists','user_list_series','moderation_queue','admin_highlights'] loop
    execute format('alter table public.%I enable row level security',target);
  end loop;
end;
$$;
create policy public_comments on public.comments for select using(true);
create policy own_comment on public.comments for insert with check(auth.uid()=user_id);
create policy delete_own_comment on public.comments for delete using(auth.uid()=user_id);
create policy public_trailer_comments on public.trailer_comments for select using(true);
create policy own_trailer_comment on public.trailer_comments for insert with check(auth.uid()=user_id);
create policy own_reactions on public.episode_reactions for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy own_favorites on public.user_series for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
alter table storage.objects enable row level security;
create policy public_avatars on storage.objects for select using(bucket_id='avatars');
create policy own_avatar on storage.objects for insert to authenticated
  with check(bucket_id='avatars' and name=auth.uid()::text || '/avatar.webp');

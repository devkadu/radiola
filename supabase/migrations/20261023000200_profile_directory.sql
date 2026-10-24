-- Apply before deploying the indexed profile lookup.
-- Private directory: no emails, sessions, preferences, or public client access.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create schema if not exists radiola_private;
revoke all on schema radiola_private from public, anon, authenticated;

create table if not exists public.profile_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null
);

-- Exact-match lookup; hash indexes also accept long existing metadata values.
-- Existing duplicate usernames remain valid; the application picks oldest/id.
create index if not exists profile_directory_username_idx
  on public.profile_directory using hash (username);

alter table public.profile_directory enable row level security;
revoke all on public.profile_directory from public, anon, authenticated, service_role;
grant select on public.profile_directory to service_role;

create or replace function radiola_private.profile_directory_username(p_metadata jsonb, p_email text)
returns text
language sql immutable
set search_path = ''
as $$
  select case
    when pg_catalog.jsonb_typeof(p_metadata -> 'username') = 'string'
      -- Same whitespace characters as JavaScript String.trim().
      and pg_catalog.btrim(p_metadata ->> 'username', U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') <> ''
    then p_metadata ->> 'username'
    else coalesce(pg_catalog.split_part(p_email, '@', 1), '')
  end;
$$;
revoke execute on function radiola_private.profile_directory_username(jsonb, text) from public, anon, authenticated;

create or replace function radiola_private.sync_profile_directory()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profile_directory(user_id, username, created_at)
  values (new.id, radiola_private.profile_directory_username(new.raw_user_meta_data, new.email),
    coalesce(new.created_at, pg_catalog.now()))
  on conflict (user_id) do update set username = excluded.username
    where public.profile_directory.username is distinct from excluded.username;
  return new;
end;
$$;
revoke execute on function radiola_private.sync_profile_directory() from public, anon, authenticated;

-- Install the trigger before the backfill so concurrent signups cannot be missed.
drop trigger if exists radiola_sync_profile_directory on auth.users;
create trigger radiola_sync_profile_directory
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function radiola_private.sync_profile_directory();

insert into public.profile_directory(user_id, username, created_at)
select u.id, radiola_private.profile_directory_username(u.raw_user_meta_data, u.email),
  coalesce(u.created_at, pg_catalog.now())
from auth.users u
on conflict (user_id) do update
  set username = excluded.username, created_at = excluded.created_at;

commit;

-- Metadata-only confirmation: no usernames, emails or IDs are returned.
select
  (select count(*) from public.profile_directory) as indexed_accounts,
  (select count(*) from (
    select username from public.profile_directory where username <> ''
    group by username having count(*) > 1
  ) duplicate_names) as duplicate_usernames;

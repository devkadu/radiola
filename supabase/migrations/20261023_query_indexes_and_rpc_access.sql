-- Prepared from the catalog/policy audit supplied on 2026-10-23.
-- Review and test in a separate database first. Does not delete application rows.
-- These RPCs are called only by supabaseAdmin in the current repository.
-- Apply before returning to production; no remote execution is automated here.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- Existing unique indexes already cover user_series(user_id, series_id),
-- watched_episodes(user_id, episode_id), and user_list_series(list_id, series_id).
create index if not exists comments_episode_created_idx
  on public.comments (episode_id, created_at, id);
create index if not exists comments_user_created_idx
  on public.comments (user_id, created_at, id);
create index if not exists user_lists_user_created_idx
  on public.user_lists (user_id, created_at);
create index if not exists episodes_series_idx
  on public.episodes (series_id);
create index if not exists follows_following_idx
  on public.follows (following_id);
create index if not exists episode_reactions_user_idx
  on public.episode_reactions (user_id);

-- Each removed policy has an equivalent remaining policy in the supplied audit:
-- Anyone can read reactions, Authenticated can react, Owner can delete/update.
drop policy if exists "Anyone can view" on public.episode_reactions;
drop policy if exists "Users can insert own reactions" on public.episode_reactions;
drop policy if exists "Users can delete own reactions" on public.episode_reactions;
drop policy if exists "Users can update own reactions" on public.episode_reactions;

-- A public EXECUTE grant bypasses application-level rate limiting and caching.
-- Revoke PUBLIC as well as direct grants; retain explicit backend execution.
revoke execute on function public.get_top_commenters_7days() from public, anon, authenticated;
revoke execute on function public.get_trending_seasons() from public, anon, authenticated;
revoke execute on function public.hot_episodes() from public, anon, authenticated;
revoke execute on function public.hot_episodes_by_series(integer[]) from public, anon, authenticated;
revoke execute on function public.popular_series() from public, anon, authenticated;

grant execute on function public.get_top_commenters_7days() to service_role;
grant execute on function public.get_trending_seasons() to service_role;
grant execute on function public.hot_episodes() to service_role;
grant execute on function public.hot_episodes_by_series(integer[]) to service_role;
grant execute on function public.popular_series() to service_role;

commit;

import { readAll } from "@/server/database/read-all";
import "server-only";

import { requireUser } from "@/server/auth/auth";
import type { ProfileComment,ProfileOverview } from "../../types/profile";

export async function getProfileOverview(): Promise<ProfileOverview> {
  const { user, supabase } = await requireUser();
  const [favorites, comments, reactions, watched] = await Promise.all([
    supabase.from("user_series").select("series_id, series_name, series_slug, poster_path")
      .eq("user_id", user.id).order("created_at", { ascending: false }),
    readAll<ProfileComment>((from, to) => supabase.from("comments").select("id, text, likes, episode_id, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).order("id").range(from, to).returns<ProfileComment[]>()),
    readAll<{ reaction_key: string }>((from, to) => supabase.from("episode_reactions").select("reaction_key")
      .eq("user_id", user.id).order("episode_id").order("reaction_key").range(from, to)),
    supabase.from("watched_episodes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  for (const result of [favorites, watched]) if (result.error) throw result.error;
  const rows = comments;
  const seriesIds = [...new Set(rows.map((row) => row.episode_id.match(/^(\d+)-s/)?.[1]).filter(Boolean))];
  const names = seriesIds.length
    ? await supabase.from("series").select("id, name").in("id", seriesIds)
    : { data: [], error: null };
  if (names.error) throw names.error;
  const reactionCounts: Record<string, number> = {};
  for (const reaction of reactions) {
    reactionCounts[reaction.reaction_key] = (reactionCounts[reaction.reaction_key] ?? 0) + 1;
  }
  return {
    favorites: favorites.data ?? [], commentCount: rows.length,
    totalLikes: rows.reduce((total, comment) => total + (comment.likes ?? 0), 0),
    reactionCounts,
    topComment: rows.reduce<ProfileComment | null>((top, row) => !top || (row.likes ?? 0) > (top.likes ?? 0) ? row : top, null),
    recentComments: rows.slice(0, 5),
    seriesNames: Object.fromEntries((names.data ?? []).map((series) => [series.id, series.name])),
    watchedEpisodesCount: watched.count ?? 0,
  };
}

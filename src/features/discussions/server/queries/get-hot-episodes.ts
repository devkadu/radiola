import { episodeSlug,seriesSlug } from "@/features/catalog/utils/slugs";
import { parseEpisodeId } from "@/features/progress/functions/parse-episode-id";
import { supabaseAdmin as supabase } from "@/server/database/admin";
import { getEpisodeDetails } from "@/server/integrations/tmdb/requests/get-episode-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";

export async function getHotEpisodes(limit = 5) {
  const { data: topIds, error } = await supabase.rpc("hot_episodes");
  if (error || !topIds?.length) return [];

  const results = await Promise.all(
    topIds.slice(0, limit).map(async (row: { episode_id: string; comment_count: number | string }, idx: number) => {
      const parsed = parseEpisodeId(row.episode_id);
      if (!parsed) return null;

      const [ep, series] = await Promise.all([
        getEpisodeDetails(parsed.seriesId, parsed.season, parsed.episode).catch(() => null),
        getSeriesDetails(parsed.seriesId).catch(() => null),
      ]);

      if (!ep || !series) return null;

      const seasonLabel = `T${String(parsed.season).padStart(2, "0")}`;
      const episodeLabel = `E${String(parsed.episode).padStart(2, "0")}`;

      return {
        rank: idx + 1,
        epId: row.episode_id,
        series: series.name,
        episode: `"${ep.name}"`,
        code: `${seasonLabel} · ${episodeLabel}`,
        comments: Number(row.comment_count),
        href: `/series/${seriesSlug(series.name, series.id)}/temporada-${parsed.season}/${episodeSlug(parsed.episode, ep.name)}`,
      };
    })
  );

  return results.filter(Boolean);
}

import { episodeSlug,seriesSlug } from "@/features/catalog/utils/slugs";
import { parseEpisodeId } from "@/features/progress/functions/parse-episode-id";
import { supabaseAdmin as supabase } from "@/server/database/admin";
import { getEpisodeDetails } from "@/server/integrations/tmdb/requests/get-episode-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { mapWithConcurrency } from "@/shared/utils/map-with-concurrency";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const MAX_SERIES_IDS = 1000;
const MAX_EPISODES = 20;
const ENRICHMENT_CONCURRENCY = 2;
const idsSchema = z.array(z.string().trim().regex(/^\d+$/).transform(Number)
  .pipe(z.number().int().positive().max(2_147_483_647))).max(MAX_SERIES_IDS);
const cacheHeaders = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

export const GET = async (req: NextRequest) => {
  const rawIds = req.nextUrl.searchParams.get("ids")?.trim() ?? "";
  if (!rawIds) return NextResponse.json([], { headers: cacheHeaders });
  const ids = [...new Set(idsSchema.parse(rawIds.split(",")))];

  const { data: topIds, error } = await supabase.rpc("hot_episodes_by_series", {
    series_ids: ids,
  });

  if (error) throw error;

  if (!topIds?.length) return NextResponse.json([], { headers: cacheHeaders });

  const results = await mapWithConcurrency(
    topIds.slice(0, MAX_EPISODES), ENRICHMENT_CONCURRENCY,
    async (row: { episode_id: string; comment_count: number | string }, idx: number) => {
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
    },
  );

  return NextResponse.json(results.filter(Boolean), { headers: cacheHeaders });
};

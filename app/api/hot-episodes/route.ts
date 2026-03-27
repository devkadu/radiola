import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug, episodeSlug } from "@/lib/slugs";

function parseEpisodeId(epId: string) {
  const m = epId.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!m) return null;
  return { seriesId: m[1], season: parseInt(m[2]), episode: parseInt(m[3]) };
}

export async function GET() {
  const { data: topIds, error } = await supabase.rpc("hot_episodes");

  if (error) {
    console.error("[hot-episodes] rpc error:", error);
    return NextResponse.json([]);
  }

  if (!topIds?.length) return NextResponse.json([]);

  const results = await Promise.all(
    topIds.map(async (row: any, idx: number) => {
      const parsed = parseEpisodeId(row.episode_id);
      if (!parsed) return null;

      const [ep, series] = await Promise.all([
        tmdbService.getEpisodeDetails(parsed.seriesId, parsed.season, parsed.episode).catch(() => null),
        tmdbService.getSeriesDetails(parsed.seriesId).catch(() => null),
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

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}

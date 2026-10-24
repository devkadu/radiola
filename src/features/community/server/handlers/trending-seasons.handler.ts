import { seriesSlug } from "@/features/catalog/utils/slugs";
import { supabaseAdmin as supabase } from "@/server/database/admin";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  const { data: topSeasons, error } = await supabase.rpc("get_trending_seasons");

  if (error || !topSeasons?.length) return NextResponse.json([]);

  const top: Array<{ seriesId: string; season: number; score: number }> = topSeasons;

  const results = await Promise.all(
    top.map(async ({ seriesId, season, score }) => {
      const series = await getSeriesDetails(seriesId).catch(() => null);
      if (!series) return null;

      return {
        key: `${seriesId}-s${season}`,
        seriesId,
        season,
        seriesName: series.name,
        posterPath: series.poster_path ?? null,
        href: `/series/${seriesSlug(series.name, series.id)}?season=${season}`,
        score,
      };
    })
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

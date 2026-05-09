import { NextRequest, NextResponse } from "next/server";
import { cacheService } from "@/services/cache";
import { tmdbService } from "@/services/tmdb";

export async function POST(req: NextRequest) {
  const { seriesId } = await req.json();
  if (!seriesId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const series = await tmdbService.getSeriesDetails(String(seriesId));
    const seasons = series?.seasons?.filter((s: any) => s.season_number > 0) ?? [];
    const seasonDetails = (
      await Promise.all(
        seasons.map((s: any) =>
          tmdbService.getSeasonDetails(String(seriesId), s.season_number).catch(() => null)
        )
      )
    ).filter(Boolean);
    const allEpisodes = seasonDetails.flatMap((s: any) => s.episodes ?? []);
    await cacheService.cacheEpisodes(seriesId, allEpisodes);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

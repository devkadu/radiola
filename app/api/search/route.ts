import { cacheService } from "@/services/cache";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug } from "@/lib/slugs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json({ series: [], episodes: [] });

  const [cached, tmdbData] = await Promise.all([
    cacheService.search(q),
    tmdbService.searchSeries(q),
  ]);

  const cachedIds = new Set(cached.series.map((s: any) => s.id));
  const tmdbSeries = (tmdbData.results ?? [])
    .filter((s: any) => !cachedIds.has(s.id))
    .slice(0, 5)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      poster_path: s.poster_path,
      slug: seriesSlug(s.name, s.id),
    }));

  return NextResponse.json({
    series: [...cached.series.slice(0, 3), ...tmdbSeries].slice(0, 5),
    episodes: cached.episodes.slice(0, 5),
  }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

import { cacheService } from "@/features/catalog/server/cache";
import { searchQuerySchema } from "@/features/search/schemas/search-query.schema";
import { seriesSlug } from "@/features/catalog/utils/slugs";
import { searchSeries } from "@/server/integrations/tmdb/requests/search-series";
import { NextRequest,NextResponse } from "next/server";
import "server-only";

export const GET = async (req: NextRequest) => {
  const q = searchQuerySchema.parse(req.nextUrl.searchParams.get("q") ?? "");

  if (q.length < 2) return NextResponse.json({ series: [], episodes: [] });

  const [cached, tmdbData] = await Promise.all([
    cacheService.search(q),
    searchSeries(q),
  ]);

  const cachedIds = new Set(cached.series.map((s) => s.id));
  const tmdbSeries = (tmdbData.results ?? [])
    .filter((s) => !cachedIds.has(s.id))
    .slice(0, 5)
    .map((s) => ({
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
};

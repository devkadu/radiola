import { cacheService } from "@/features/catalog/server/cache";
import { requireUser } from "@/server/auth/auth";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { getSeasonDetails } from "@/server/integrations/tmdb/requests/get-season-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { mapWithConcurrency } from "@/shared/utils/map-with-concurrency";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const schema = z.object({ seriesId: z.number().int().positive().max(2_147_483_647) });

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser();
    const { seriesId } = schema.parse(await readJson(req));
    const { data: favorite, error } = await supabase.from("user_series")
      .select("series_id").eq("user_id", user.id).eq("series_id", seriesId).maybeSingle();
    if (error) throw error;
    if (!favorite) return NextResponse.json({ error: "Série não favoritada" }, { status: 403 });
    const series = await getSeriesDetails(String(seriesId));
    const seasons = (series.seasons ?? []).filter((s: { season_number: number }) => s.season_number > 0);
    const seasonDetails = await mapWithConcurrency(seasons, 4, (s: { season_number: number }) =>
      getSeasonDetails(String(seriesId), s.season_number));
    const allEpisodes = seasonDetails.flatMap((s) => s.episodes ?? []);
    await cacheService.cacheSeries(series);
    await cacheService.cacheEpisodes(seriesId, allEpisodes);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "catalog.cache-episodes");
  }
}

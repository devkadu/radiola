import { cacheService } from "@/features/catalog/server/cache";
import { seriesSlug } from "@/features/catalog/utils/slugs";
import { requireUser } from "@/server/auth/auth";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const input = z.object({ seriesId: z.number().int().positive() }).strict();

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const { seriesId } = input.parse(await readJson(request));
    const series = await getSeriesDetails(String(seriesId));
    // Parent metadata is cached only on an authenticated write, never during rendering.
    await cacheService.cacheSeries(series);
    const { error } = await supabase.from("user_series").insert({
      user_id: user.id, series_id: series.id, series_name: series.name,
      series_slug: seriesSlug(series.name, series.id), poster_path: series.poster_path,
    });
    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "favorites.add"); }
}

export async function DELETE(request: Request) {
  try {
    const { user, supabase } = await requireUser();
    const { seriesId } = input.parse(await readJson(request));
    const { error } = await supabase.from("user_series").delete().eq("user_id", user.id).eq("series_id", seriesId);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error, "favorites.remove"); }
}

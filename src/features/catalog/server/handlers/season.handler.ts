import { apiError } from "@/server/http/api-error";
import { getSeasonDetails } from "@/server/integrations/tmdb/requests/get-season-details";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";
const input = z.object({ seriesId: z.coerce.number().int().positive().max(2_147_483_647), seasonNumber: z.coerce.number().int().min(0).max(1000) });
export async function GET(request: NextRequest) {
  try {
    const { seriesId, seasonNumber } = input.parse(Object.fromEntries(request.nextUrl.searchParams));
    const season = await getSeasonDetails(String(seriesId), seasonNumber);
    return NextResponse.json(season, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300" } });
  } catch (error) { return apiError(error, "catalog.season"); }
}

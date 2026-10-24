import { apiError } from "@/server/http/api-error";
import { discoverSeries } from "@/server/integrations/tmdb/requests/discover-series";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const input = z.object({
  page: z.coerce.number().int().min(1).max(500),
  sortBy: z.enum([
    "popularity.desc",
    "popularity.asc",
    "vote_average.desc",
    "vote_average.asc",
    "first_air_date.desc",
    "first_air_date.asc",
  ]),
  genreId: z.coerce.number().int().positive().max(2_147_483_647).nullable(),
  providerId: z.coerce.number().int().positive().max(2_147_483_647).nullable(),
});

export const GET = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;

  try {
    const filters = input.parse({
      page: searchParams.get("page") ?? 1,
      sortBy: searchParams.get("sortBy") ?? "popularity.desc",
      genreId: searchParams.get("genreId"),
      providerId: searchParams.get("providerId"),
    });
    const data = await discoverSeries(filters);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return apiError(error, "catalog.discover");
  }
};

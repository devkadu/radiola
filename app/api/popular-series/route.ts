import { NextRequest, NextResponse } from "next/server";
import { tmdbService } from "@/services/tmdb";

export async function GET(req: NextRequest) {
  const genreId = req.nextUrl.searchParams.get("genre");
  const { results } = await tmdbService.getPopularSeries(1, genreId ? Number(genreId) : null);
  return NextResponse.json(results ?? []);
}

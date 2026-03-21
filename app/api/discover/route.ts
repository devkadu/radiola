import { tmdbService } from "@/services/tmdb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page       = Number(searchParams.get("page") ?? "1");
  const sortBy     = searchParams.get("sortBy")     ?? "popularity.desc";
  const genreId    = searchParams.get("genreId")    ? Number(searchParams.get("genreId"))    : null;
  const providerId = searchParams.get("providerId") ? Number(searchParams.get("providerId")) : null;

  try {
    const data = await tmdbService.discoverSeries({ page, sortBy, genreId, providerId });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ results: [], total_pages: 0 }, { status: 500 });
  }
}

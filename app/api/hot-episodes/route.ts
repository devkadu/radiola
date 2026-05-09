import { NextResponse } from "next/server";
import { getHotEpisodes } from "@/lib/hot-episodes";

export async function GET() {
  const results = await getHotEpisodes();
  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  });
}

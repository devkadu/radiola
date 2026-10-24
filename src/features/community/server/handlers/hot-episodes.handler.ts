import { getHotEpisodes } from "@/features/discussions/server/queries/get-hot-episodes";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  const results = await getHotEpisodes();
  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" },
  });
}

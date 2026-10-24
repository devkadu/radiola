import { supabaseAdmin as supabase } from "@/server/database/admin";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  const { data, error } = await supabase.rpc("popular_series");

  if (error) {
    console.error("[popular-series] rpc error:", error);
    return NextResponse.json([]);
  }

  if (!data?.length) return NextResponse.json([]);

  const results = await Promise.all(
    data.map(async (row: { series_id: number; favorite_count: number }) => {
      const series = await getSeriesDetails(String(row.series_id)).catch(() => null);
      if (!series) return null;
      return { ...series, favorite_count: row.favorite_count };
    })
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

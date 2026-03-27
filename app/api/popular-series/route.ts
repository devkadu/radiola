import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { tmdbService } from "@/services/tmdb";

export async function GET() {
  const { data, error } = await supabase.rpc("popular_series");

  if (error) {
    console.error("[popular-series] rpc error:", error);
    return NextResponse.json([]);
  }

  if (!data?.length) return NextResponse.json([]);

  const results = await Promise.all(
    data.map(async (row: { series_id: number; favorite_count: number }) => {
      const series = await tmdbService.getSeriesDetails(String(row.series_id)).catch(() => null);
      if (!series) return null;
      return { ...series, favorite_count: row.favorite_count };
    })
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabase.rpc("get_top_commenters_7days");

  if (error || !data) return NextResponse.json([]);

  return NextResponse.json(
    data.map((row: any, i: number) => ({ rank: i + 1, ...row })),
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
  );
}

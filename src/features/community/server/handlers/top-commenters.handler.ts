import { supabaseAdmin as supabase } from "@/server/database/admin";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  const { data, error } = await supabase.rpc("get_top_commenters_7days");

  if (error || !data) return NextResponse.json([]);

  return NextResponse.json(
    data.map((row: { user_id: string; username: string; avatar_url: string | null; comments: number }, i: number) => ({ rank: i + 1, ...row })),
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
  );
}

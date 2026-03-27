import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabase.rpc("hot_episodes");

  if (error || !data?.length) return NextResponse.json([]);

  const results = data.map((row: any, idx: number) => {
    const seasonLabel = `T${String(row.season_number).padStart(2, "0")}`;
    const episodeLabel = `E${String(row.episode_number).padStart(2, "0")}`;

    return {
      rank: idx + 1,
      epId: row.ep_id,
      series: row.series_name,
      episode: `"${row.ep_name}"`,
      code: `${seasonLabel} · ${episodeLabel}`,
      comments: Number(row.comment_count),
      href: `/series/${row.series_slug}/temporada-${row.season_number}/${row.ep_slug}`,
    };
  });

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
  });
}

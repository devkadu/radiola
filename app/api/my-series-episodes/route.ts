import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function parseEpisodeId(epId: string) {
  const match = epId.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!match) return null;
  return {
    seriesId: parseInt(match[1]),
    season: parseInt(match[2]),
    episode: parseInt(match[3]),
  };
}

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json([]);

  // Fetch all comments whose episode_id starts with one of the series IDs
  const { data: comments } = await supabase
    .from("comments")
    .select("episode_id");

  if (!comments?.length) return NextResponse.json([]);

  // Filter by series IDs and aggregate counts
  const counts: Record<string, number> = {};
  for (const row of comments) {
    const parsed = parseEpisodeId(row.episode_id);
    if (!parsed) continue;
    if (!ids.includes(String(parsed.seriesId))) continue;
    counts[row.episode_id] = (counts[row.episode_id] ?? 0) + 1;
  }

  const topEpisodeIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([epId, count]) => ({ epId, count }));

  if (topEpisodeIds.length === 0) return NextResponse.json([]);

  const results = await Promise.all(
    topEpisodeIds.map(async ({ epId, count }, idx) => {
      const parsed = parseEpisodeId(epId);
      if (!parsed) return null;

      const { data: ep } = await supabase
        .from("episodes")
        .select("name, slug, season_number, episode_number, series:series_id(id, name, slug)")
        .eq("series_id", parsed.seriesId)
        .eq("season_number", parsed.season)
        .eq("episode_number", parsed.episode)
        .maybeSingle();

      if (!ep) return null;

      const series = ep.series as any;
      const seasonLabel = `T${String(parsed.season).padStart(2, "0")}`;
      const episodeLabel = `E${String(parsed.episode).padStart(2, "0")}`;

      return {
        rank: idx + 1,
        epId,
        series: series?.name ?? "Série desconhecida",
        episode: `"${ep.name}"`,
        code: `${seasonLabel} · ${episodeLabel}`,
        comments: count,
        href: `/series/${series?.slug}/temporada-${parsed.season}/${ep.slug}`,
      };
    })
  );

  return NextResponse.json(results.filter(Boolean));
}

import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug } from "@/lib/slugs";

function parseEpisodeId(epId: string) {
  const m = epId.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!m) return null;
  return { seriesId: m[1], season: parseInt(m[2]) };
}

export async function GET() {
  // Busca contagem de comentários por episode_id
  const [{ data: comments }, { data: reactions }, { data: watched }] = await Promise.all([
    supabase.from("comments").select("episode_id"),
    supabase.from("episode_reactions").select("episode_id"),
    supabase.from("watched_episodes").select("episode_id"),
  ]);

  // Agrega interações por série+temporada
  const scoreMap = new Map<string, number>();

  for (const row of [...(comments ?? []), ...(reactions ?? []), ...(watched ?? [])]) {
    const parsed = parseEpisodeId(row.episode_id);
    if (!parsed) continue;
    const key = `${parsed.seriesId}-s${parsed.season}`;
    scoreMap.set(key, (scoreMap.get(key) ?? 0) + 1);
  }

  // Ordena e pega top 6
  const top = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!top.length) return NextResponse.json([]);

  const results = await Promise.all(
    top.map(async ([key, score]) => {
      const m = key.match(/^(\d+)-s(\d+)$/);
      if (!m) return null;
      const seriesId = m[1];
      const season = parseInt(m[2]);

      const series = await tmdbService.getSeriesDetails(seriesId).catch(() => null);
      if (!series) return null;

      return {
        key,
        seriesId,
        season,
        seriesName: series.name,
        posterPath: series.poster_path ?? null,
        href: `/series/${seriesSlug(series.name, series.id)}?season=${season}`,
        score,
      };
    })
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug, seasonSlug, episodeSlug } from "@/lib/slugs";

function parseEpisodeId(epId: string) {
  const m = epId.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!m) return null;
  return { seriesId: m[1], season: parseInt(m[2]), episode: parseInt(m[3]) };
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: rows } = await supabase
    .from("watched_episodes")
    .select("episode_id, watched_at")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: false })
    .limit(30);

  if (!rows?.length) return NextResponse.json([]);

  const results = await Promise.all(
    rows.map(async (row) => {
      const parsed = parseEpisodeId(row.episode_id);
      if (!parsed) return null;

      const [ep, series] = await Promise.all([
        tmdbService.getEpisodeDetails(parsed.seriesId, parsed.season, parsed.episode).catch(() => null),
        tmdbService.getSeriesDetails(parsed.seriesId).catch(() => null),
      ]);

      if (!ep || !series) return null;

      return {
        epId: row.episode_id,
        watchedAt: row.watched_at,
        seriesName: series.name,
        episodeName: ep.name,
        seasonNumber: parsed.season,
        episodeNumber: parsed.episode,
        still_path: ep.still_path ?? null,
        poster_path: series.poster_path ?? null,
        href: `/series/${seriesSlug(series.name, series.id)}/${seasonSlug(parsed.season)}/${episodeSlug(parsed.episode, ep.name)}`,
      };
    })
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "no-store" },
  });
}

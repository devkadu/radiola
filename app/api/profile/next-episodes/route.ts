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

  // Séries favoritas + episódios assistidos em paralelo
  const [{ data: favs }, { data: watchedRows }] = await Promise.all([
    supabase.from("user_series").select("series_id, series_name, series_slug, poster_path").eq("user_id", user.id),
    supabase.from("watched_episodes").select("episode_id").eq("user_id", user.id),
  ]);

  if (!favs?.length) return NextResponse.json([]);

  const watchedSet = new Set((watchedRows ?? []).map((r) => r.episode_id));

  const today = new Date().toISOString().split("T")[0];

  const rawResults = await Promise.all(
    favs.map(async (fav) => {
      const seriesId = String(fav.series_id);

      const watchedForSeries = [...watchedSet]
        .map(parseEpisodeId)
        .filter((p) => p && p.seriesId === seriesId)
        .sort((a, b) => b!.season !== a!.season ? b!.season - a!.season : b!.episode - a!.episode);

      const latest = watchedForSeries[0];
      let searchSeason = latest ? latest.season : 1;
      let searchEpisode = latest ? latest.episode + 1 : 1;

      for (let attempt = 0; attempt < 2; attempt++) {
        const nextEp = await tmdbService
          .getEpisodeDetails(seriesId, searchSeason, searchEpisode)
          .catch(() => null);

        if (nextEp) {
          const airDate = nextEp.air_date ?? null;
          const isUpcoming = airDate ? airDate > today : false;
          const epId = `${fav.series_id}-s${searchSeason}-e${searchEpisode}`;

          return {
            seriesId: fav.series_id,
            seriesName: fav.series_name,
            poster_path: fav.poster_path,
            seriesHref: `/series/${fav.series_slug}`,
            episodeName: nextEp.name,
            seasonNumber: searchSeason,
            episodeNumber: searchEpisode,
            airDate,
            isUpcoming,
            still_path: nextEp.still_path ?? null,
            href: `/series/${fav.series_slug}/${seasonSlug(searchSeason)}/${episodeSlug(searchEpisode, nextEp.name)}`,
            epId,
            commentCount: 0,
          };
        }

        searchSeason += 1;
        searchEpisode = 1;
      }

      return null;
    })
  );

  const results = rawResults.filter(Boolean) as NonNullable<typeof rawResults[0]>[];

  // Busca contagem de comentários em batch para todos os episódios
  if (results.length > 0) {
    const epIds = results.map((r) => r.epId);
    const { data: commentRows } = await supabase
      .from("comments")
      .select("episode_id")
      .in("episode_id", epIds);

    const counts: Record<string, number> = {};
    for (const row of commentRows ?? []) {
      counts[row.episode_id] = (counts[row.episode_id] ?? 0) + 1;
    }
    for (const r of results) {
      r.commentCount = counts[r.epId] ?? 0;
    }
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}

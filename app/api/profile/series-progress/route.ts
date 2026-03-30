import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { tmdbService } from "@/services/tmdb";

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
  if (!user) return NextResponse.json({}, { status: 401 });

  const [{ data: favs }, { data: watchedRows }] = await Promise.all([
    supabase.from("user_series").select("series_id").eq("user_id", user.id),
    supabase.from("watched_episodes").select("episode_id").eq("user_id", user.id),
  ]);

  if (!favs?.length) return NextResponse.json({});

  // Conta assistidos por série
  const watchedBySeriesId: Record<string, number> = {};
  for (const row of watchedRows ?? []) {
    const m = row.episode_id.match(/^(\d+)-s/);
    if (!m) continue;
    watchedBySeriesId[m[1]] = (watchedBySeriesId[m[1]] ?? 0) + 1;
  }

  // Busca total de episódios no TMDB (já tem cache de 1h)
  const progress: Record<number, { watched: number; total: number }> = {};
  await Promise.all(
    favs.map(async (fav) => {
      const series = await tmdbService.getSeriesDetails(String(fav.series_id)).catch(() => null);
      const total = series?.number_of_episodes ?? 0;
      const watched = watchedBySeriesId[String(fav.series_id)] ?? 0;
      progress[fav.series_id] = { watched, total };
    })
  );

  return NextResponse.json(progress, {
    headers: { "Cache-Control": "no-store" },
  });
}

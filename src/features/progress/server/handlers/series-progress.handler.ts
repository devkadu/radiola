import { readAll } from "@/server/database/read-all";
import { createClient } from "@/server/database/session";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { mapWithConcurrency } from "@/shared/utils/map-with-concurrency";
import "server-only";

import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({}, { status: 401 });

  const [{ data: favs }, watchedRows] = await Promise.all([
    supabase.from("user_series").select("series_id").eq("user_id", user.id),
    readAll<{ episode_id: string }>((from, to) => supabase.from("watched_episodes").select("episode_id").eq("user_id", user.id).order("episode_id").range(from, to)),
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
  await mapWithConcurrency(favs, 4, async (fav) => {
      const series = await getSeriesDetails(String(fav.series_id)).catch(() => null);
      const total = series?.number_of_episodes ?? 0;
      const watched = watchedBySeriesId[String(fav.series_id)] ?? 0;
      progress[fav.series_id] = { watched, total };
    }
  );

  return NextResponse.json(progress, {
    headers: { "Cache-Control": "no-store" },
  });
}

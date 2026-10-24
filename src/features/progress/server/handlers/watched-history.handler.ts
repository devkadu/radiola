import { episodeSlug,seasonSlug,seriesSlug } from "@/features/catalog/utils/slugs";
import { parseEpisodeId } from "@/features/progress/functions/parse-episode-id";
import { createClient } from "@/server/database/session";
import { getEpisodeDetails } from "@/server/integrations/tmdb/requests/get-episode-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { mapWithConcurrency } from "@/shared/utils/map-with-concurrency";
import "server-only";

import { NextResponse } from "next/server";


export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: rows } = await supabase
    .from("watched_episodes")
    .select("episode_id, watched_at")
    .eq("user_id", user.id)
    .order("watched_at", { ascending: false })
    .limit(30);

  if (!rows?.length) return NextResponse.json([]);

  const results = await mapWithConcurrency(rows, 4, async (row) => {
      const parsed = parseEpisodeId(row.episode_id);
      if (!parsed) return null;

      const [ep, series] = await Promise.all([
        getEpisodeDetails(parsed.seriesId, parsed.season, parsed.episode).catch(() => null),
        getSeriesDetails(parsed.seriesId).catch(() => null),
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
    }
  );

  return NextResponse.json(results.filter(Boolean), {
    headers: { "Cache-Control": "no-store" },
  });
}

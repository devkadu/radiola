import type { Episode,Series } from "@/features/catalog/types/tmdb";
import { episodeSlug,seriesSlug } from "@/features/catalog/utils/slugs";
import { supabaseAdmin } from "@/server/database/admin";
import "server-only";

export interface CachedSeries { id: number; name: string; slug: string; poster_path: string | null }
export interface CachedEpisode {
  id: number; name: string; slug: string; season_number: number; episode_number: number; series_id: number;
  series: { id: number; name: string; slug: string } | null;
}

export const cacheService = {
  async cacheSeries(series: Pick<Series, "id" | "name" | "poster_path">) {
    const { error } = await supabaseAdmin.from("series").upsert({
      id: series.id,
      name: series.name,
      slug: seriesSlug(series.name, series.id),
      poster_path: series.poster_path ?? null,
    });
    if (error) throw error;
  },

  async cacheEpisodes(seriesId: number, episodes: Pick<Episode, "id" | "season_number" | "episode_number" | "name">[]) {
    if (!episodes?.length) return;

    const rows = episodes.map((ep) => ({
      id: ep.id,
      series_id: seriesId,
      season_number: ep.season_number,
      episode_number: ep.episode_number,
      name: ep.name,
      slug: episodeSlug(ep.episode_number, ep.name),
    }));

    const { error } = await supabaseAdmin.from("episodes").upsert(rows);
    if (error) throw error;
  },

  async search(query: string) {
    const tsquery = query.trim();

    const [seriesRes, episodesRes] = await Promise.all([
      supabaseAdmin
        .from("series")
        .select("id, name, slug, poster_path")
        .textSearch("name", tsquery, { config: "portuguese", type: "plain" })
        .limit(5).returns<CachedSeries[]>(),

      supabaseAdmin
        .from("episodes")
        .select("id, name, slug, season_number, episode_number, series_id, series(id, name, slug)")
        .textSearch("name", tsquery, { config: "portuguese", type: "plain" })
        .limit(10).returns<CachedEpisode[]>(),
    ]);

    if (seriesRes.error) throw seriesRes.error;
    if (episodesRes.error) throw episodesRes.error;
    return {
      series: seriesRes.data ?? [],
      episodes: episodesRes.data ?? [],
    };
  },
};

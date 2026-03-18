import { supabase } from "@/lib/supabase";
import { seriesSlug, episodeSlug } from "@/lib/slugs";

export const cacheService = {
  async cacheSeries(series: any) {
    await supabase.from("series").upsert({
      id: series.id,
      name: series.name,
      slug: seriesSlug(series.name, series.id),
      poster_path: series.poster_path ?? null,
    });
  },

  async cacheEpisodes(seriesId: number, episodes: any[]) {
    if (!episodes?.length) return;

    const rows = episodes.map((ep) => ({
      id: ep.id,
      series_id: seriesId,
      season_number: ep.season_number,
      episode_number: ep.episode_number,
      name: ep.name,
      slug: episodeSlug(ep.episode_number, ep.name),
    }));

    await supabase.from("episodes").upsert(rows);
  },

  async search(query: string) {
    const tsquery = query.trim().split(/\s+/).join(" & ");

    const [seriesRes, episodesRes] = await Promise.all([
      supabase
        .from("series")
        .select("id, name, slug, poster_path")
        .textSearch("name", tsquery, { config: "portuguese" })
        .limit(5),

      supabase
        .from("episodes")
        .select("id, name, slug, season_number, episode_number, series_id, series(id, name, slug)")
        .textSearch("name", tsquery, { config: "portuguese" })
        .limit(10),
    ]);

    return {
      series: seriesRes.data ?? [],
      episodes: episodesRes.data ?? [],
    };
  },
};

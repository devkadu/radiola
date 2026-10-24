import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export interface DiscoverSeriesOptions {
  page?: number;
  sortBy?: string;
  genreId?: number | null;
  providerId?: number | null;
}
export function discoverSeries({
  page = 1,
  sortBy = "popularity.desc",
  genreId,
  providerId,
}: DiscoverSeriesOptions = {}) {
  return tmdbRequest(endpoints.TMDB.DISCOVER_SERIES, {
    schema: seriesListSchema,
    revalidate: 1800,
    query: {
      page,
      sort_by: sortBy,
      watch_region: "BR",
      "vote_count.gte": 20,
      include_null_first_air_dates: "false",
      with_genres: genreId || undefined,
      with_watch_providers: providerId || undefined,
    },
  });
}

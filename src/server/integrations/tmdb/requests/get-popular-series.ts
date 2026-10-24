import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function getPopularSeries(page = 1, genreId?: number | null) {
  return tmdbRequest(endpoints.TMDB.DISCOVER_SERIES, {
    schema: seriesListSchema,
    revalidate: 3600,
    query: { page, sort_by: "popularity.desc", with_genres: genreId || undefined },
  });
}

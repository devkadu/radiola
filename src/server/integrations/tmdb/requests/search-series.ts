import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function searchSeries(query: string, page = 1) {
  return tmdbRequest(endpoints.TMDB.SEARCH_SERIES, {
    schema: seriesListSchema,
    revalidate: 300,
    query: { query, page },
  });
}

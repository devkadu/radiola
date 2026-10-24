import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export async function getRankedSeries(filters: Record<string, string> = {}) {
  const data = await tmdbRequest(endpoints.TMDB.DISCOVER_SERIES, {
    schema: seriesListSchema,
    revalidate: 86400,
    query: { sort_by: "vote_average.desc", page: 1, ...filters },
  });
  return data.results;
}

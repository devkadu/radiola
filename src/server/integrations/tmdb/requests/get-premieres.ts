import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function getPremieres(dateFrom: string, dateTo: string) {
  return tmdbRequest(endpoints.TMDB.DISCOVER_SERIES, {
    schema: seriesListSchema,
    revalidate: 3600,
    query: {
      sort_by: "popularity.desc",
      "first_air_date.gte": dateFrom,
      "first_air_date.lte": dateTo,
      include_null_first_air_dates: "false",
    },
  });
}

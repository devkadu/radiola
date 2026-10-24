import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function getUpcomingSeries() {
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  return tmdbRequest(endpoints.TMDB.DISCOVER_SERIES, {
    schema: seriesListSchema,
    revalidate: 43200,
    query: {
      sort_by: "popularity.desc",
      "first_air_date.gte": today.toISOString().slice(0, 10),
      "first_air_date.lte": maxDate.toISOString().slice(0, 10),
      include_null_first_air_dates: "false",
    },
  });
}

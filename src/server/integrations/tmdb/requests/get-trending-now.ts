import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function getTrendingNow(timeWindow: "day" | "week" = "day") {
  return tmdbRequest(endpoints.TMDB.GET_TRENDING(timeWindow), {
    schema: seriesListSchema,
    revalidate: timeWindow === "day" ? 3600 : 86400,
  });
}

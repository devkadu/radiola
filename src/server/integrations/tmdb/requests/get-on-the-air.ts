import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { seriesListSchema } from "../schemas";

export function getOnTheAir(page = 1) {
  return tmdbRequest(endpoints.TMDB.GET_ON_THE_AIR, {
    schema: seriesListSchema,
    revalidate: 3600,
    query: { page },
  });
}

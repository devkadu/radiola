import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { creditsSchema } from "../schemas";

export function getSeriesCredits(id: string) {
  return tmdbRequest(endpoints.TMDB.GET_SERIES_CREDITS(id), {
    schema: creditsSchema,
    revalidate: 86400,
  });
}

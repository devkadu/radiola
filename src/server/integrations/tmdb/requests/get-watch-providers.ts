import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { watchProvidersSchema } from "../schemas";

export function getWatchProviders(seriesId: string) {
  return tmdbRequest(endpoints.TMDB.GET_SERIES_PROVIDERS(seriesId), {
    schema: watchProvidersSchema,
    revalidate: 86400,
    language: false,
  });
}

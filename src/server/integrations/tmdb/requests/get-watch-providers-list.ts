import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { providersListSchema } from "../schemas";

export function getWatchProvidersList() {
  return tmdbRequest(endpoints.TMDB.GET_WATCH_PROVIDERS, {
    schema: providersListSchema,
    revalidate: 86400,
    query: { watch_region: "BR" },
  });
}

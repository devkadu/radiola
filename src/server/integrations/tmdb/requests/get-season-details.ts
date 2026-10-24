import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { cache } from "react";
import { tmdbRequest } from "../client";
import { seasonSchema } from "../schemas";

export const getSeasonDetails = cache(function (seriesId: string, seasonNumber: number) {
  return tmdbRequest(endpoints.TMDB.GET_SEASON_DETAILS(seriesId, seasonNumber), {
    schema: seasonSchema,
    revalidate: 3600,
  });
});

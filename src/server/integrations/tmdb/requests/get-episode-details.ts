import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { cache } from "react";
import { tmdbRequest } from "../client";
import { episodeSchema } from "../schemas";

export const getEpisodeDetails = cache(function (
  seriesId: string,
  seasonNumber: number,
  episodeNumber: number,
) {
  return tmdbRequest(endpoints.TMDB.GET_EPISODE_DETAILS(seriesId, seasonNumber, episodeNumber), {
    schema: episodeSchema,
    revalidate: 3600,
  });
});

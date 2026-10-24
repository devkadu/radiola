import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { videosSchema } from "../schemas";

export function getEpisodeVideos(seriesId: string, seasonNumber: number, episodeNumber: number) {
  return tmdbRequest(endpoints.TMDB.GET_EPISODE_VIDEOS(seriesId, seasonNumber, episodeNumber), {
    schema: videosSchema,
    revalidate: 3600,
  });
}

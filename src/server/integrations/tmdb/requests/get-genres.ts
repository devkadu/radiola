import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { tmdbRequest } from "../client";
import { genresSchema } from "../schemas";

export function getGenres() {
  return tmdbRequest(endpoints.TMDB.GET_GENRES, { schema: genresSchema, revalidate: 86400 });
}

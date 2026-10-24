import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { cache } from "react";
import { tmdbRequest } from "../client";
import { personTvCreditsSchema } from "../schemas";

export const getPersonTvCredits = cache(function (id: string) {
  return tmdbRequest(endpoints.TMDB.GET_PERSON_TV_CREDITS(id), {
    schema: personTvCreditsSchema,
    revalidate: 86400,
  });
});

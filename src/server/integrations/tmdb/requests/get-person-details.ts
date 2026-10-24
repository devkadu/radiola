import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { cache } from "react";
import { tmdbRequest } from "../client";
import { personSchema } from "../schemas";

export const getPersonDetails = cache(function (id: string) {
  return tmdbRequest(endpoints.TMDB.GET_PERSON_DETAILS(id), {
    schema: personSchema,
    revalidate: 86400,
  });
});

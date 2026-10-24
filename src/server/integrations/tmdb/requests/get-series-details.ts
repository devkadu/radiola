import { endpoints } from "@/shared/constants/endpoint";
import "server-only";
import { cache } from "react";
import { tmdbRequest } from "../client";
import { seriesSchema } from "../schemas";

export const getSeriesDetails = cache(function (id: string) {
  return tmdbRequest(endpoints.TMDB.GET_SERIES_DETAILS(id), {
    schema: seriesSchema,
    revalidate: 3600,
    query: { append_to_response: "videos" },
  });
});

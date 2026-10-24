"use client";
import { useQuery } from "@tanstack/react-query";
import { getSeason } from "../api/get-season";
import type { Season } from "../types/tmdb";

export function useSeason(seriesId: string, seasonNumber: number, initialSeason?: Season) {
  return useQuery({
    queryKey: ["catalog", seriesId, "season", seasonNumber],
    queryFn: ({ signal }) => getSeason(seriesId, seasonNumber, signal),
    initialData: initialSeason?.season_number === seasonNumber ? initialSeason : undefined,
    staleTime: 60 * 60 * 1000,
  });
}

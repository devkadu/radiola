import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import type { Season } from "../types/tmdb";

export function getSeason(seriesId: string, seasonNumber: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ seriesId, seasonNumber: String(seasonNumber) });
  return fetchJson<Season>(`${endpoints.INTERNAL.GET_SEASON}?${query}`, { signal });
}

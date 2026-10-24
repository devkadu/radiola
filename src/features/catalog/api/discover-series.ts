import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import type { DiscoverFilters, DiscoverPage } from "../types/discover";

export function discoverSeries(filters: DiscoverFilters, page = 1, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), sortBy: filters.sortBy });
  if (filters.genreId) query.set("genreId", String(filters.genreId));
  if (filters.providerId) query.set("providerId", String(filters.providerId));
  return fetchJson<DiscoverPage>(`${endpoints.INTERNAL.DISCOVER_SERIES}?${query}`, { signal });
}

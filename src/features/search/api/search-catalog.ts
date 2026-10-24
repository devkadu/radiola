import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import type { SearchResult } from "../types/search";

export function searchCatalog(term: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ q: term });
  return fetchJson<SearchResult>(`${endpoints.INTERNAL.SEARCH_SERIES}?${query}`, { signal });
}

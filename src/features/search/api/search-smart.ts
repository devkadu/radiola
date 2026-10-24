import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import type { SmartAnswer } from "../server/queries/get-smart-answer";

export function searchSmart(term: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ q: term });
  return fetchJson<{ smartAnswer: SmartAnswer | null }>(
    `${endpoints.INTERNAL.SMART_SEARCH}?${query}`,
    { signal },
  );
}

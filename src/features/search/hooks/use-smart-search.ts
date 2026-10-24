"use client";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useQuery } from "@tanstack/react-query";
import { searchSmart } from "../api/search-smart";

export function useSmartSearch(query: string) {
  const term = useDebouncedValue(query.trim(), 350);
  const enabled = term === query.trim() && (term.split(/\s+/).length >= 3 || term.length > 15);
  const result = useQuery({
    queryKey: ["smart-search", term],
    queryFn: ({ signal }) => searchSmart(term, signal),
    enabled,
  });
  return { ...result, data: enabled ? result.data : undefined };
}

"use client";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useQuery } from "@tanstack/react-query";
import { searchCatalog } from "../api/search-catalog";

export function useCatalogSearch(query: string) {
  const term = useDebouncedValue(query.trim());
  const result = useQuery({
    queryKey: ["catalog-search", term],
    queryFn: ({ signal }) => searchCatalog(term, signal),
    enabled: term.length >= 2 && term === query.trim(),
  });
  return {
    ...result,
    data: query.trim().length >= 2 && term === query.trim() ? result.data : undefined,
  };
}

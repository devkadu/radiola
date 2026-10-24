"use client";
import { useCatalogSearch } from "./use-catalog-search";
import { useSmartSearch } from "./use-smart-search";

export function useSearchResults(query: string) {
  const catalog = useCatalogSearch(query);
  const contextual = useSmartSearch(query);
  return {
    results: catalog.data,
    smart: contextual.data?.smartAnswer,
    catalog,
    contextual,
  };
}

"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { discoverSeries } from "../api/discover-series";
import type { DiscoverFilters, DiscoverPage } from "../types/discover";

export function useDiscoverSeries(filters: DiscoverFilters, initialPage?: DiscoverPage) {
  const { providerId, genreId, sortBy } = filters;
  const useInitialPage = !providerId && !genreId && sortBy === "popularity.desc";
  return useInfiniteQuery({
    queryKey: ["discover", providerId ?? null, genreId ?? null, sortBy],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => discoverSeries(filters, pageParam, signal),
    getNextPageParam: (last, pages) =>
      pages.length < Math.min(last.total_pages, 500) ? pages.length + 1 : undefined,
    initialData:
      useInitialPage && initialPage ? { pages: [initialPage], pageParams: [1] } : undefined,
  });
}

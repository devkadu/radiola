import type { Series } from "./tmdb";

export interface DiscoverFilters {
  sortBy: string;
  genreId?: number | null;
  providerId?: number | null;
}

export interface DiscoverPage {
  page: number;
  total_pages: number;
  results: Series[];
}

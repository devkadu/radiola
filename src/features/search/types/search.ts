export interface SearchResult {
  series: { id: number; name: string; slug: string; poster_path: string | null }[];
  episodes: {
    id: number; name: string; slug: string; season_number: number; episode_number: number;
    series: { id: number; name: string; slug: string } | null;
  }[];
}

import { discoverSeries } from "@/server/integrations/tmdb/requests/discover-series";
import { getGenres } from "@/server/integrations/tmdb/requests/get-genres";
import { getWatchProvidersList } from "@/server/integrations/tmdb/requests/get-watch-providers-list";

import { SeriesBrowser } from "@/features/catalog/components/series-browser/series-browser";


const MAX_PROVIDERS = 12;

export async function SeriesBrowserView() {
  const [providersData, genresData, initialData] = await Promise.all([
    getWatchProvidersList().catch(() => ({ results: [] })),
    getGenres().catch(() => ({ genres: [] })),
    discoverSeries({ sortBy: "popularity.desc" }).catch(() => ({ results: [], total_pages: 0 })),
  ]);

  const providers = (providersData.results ?? [])
    .sort((a, b) => a.display_priority - b.display_priority)
    .slice(0, MAX_PROVIDERS);

  const genres = genresData.genres ?? [];

  return (
    <main className="min-h-screen pb-28 text-white">
      <div className="px-4 pt-6 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Séries</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Explore, filtre por plataforma ou gênero
          </p>
        </div>

        <SeriesBrowser
          providers={providers}
          genres={genres}
          initialSeries={initialData.results ?? []}
          initialTotalPages={initialData.total_pages ?? 1}
        />
      </div>
    </main>
  );
}

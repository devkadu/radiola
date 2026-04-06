import { tmdbService } from "@/services/tmdb";
import { SeriesBrowser } from "@/components/SeriesBrowser/SeriesBrowser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Séries — Explore por plataforma e gênero",
  description:
    "Descubra e explore séries de TV por plataforma de streaming, gênero e popularidade. Filtre por Netflix, HBO, Disney+ e muito mais.",
};

// Providers mais relevantes no Brasil (por display_priority)
const MAX_PROVIDERS = 12;

export default async function SeriesPage() {
  const [providersData, genresData, initialData] = await Promise.all([
    tmdbService.getWatchProvidersList().catch(() => ({ results: [] })),
    tmdbService.getGenres().catch(() => ({ genres: [] })),
    tmdbService.discoverSeries({ sortBy: "popularity.desc" }).catch(() => ({ results: [], total_pages: 0 })),
  ]);

  const providers = (providersData.results ?? [])
    .sort((a: any, b: any) => a.display_priority - b.display_priority)
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

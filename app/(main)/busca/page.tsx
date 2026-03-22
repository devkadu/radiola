import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import Image from "next/image";
import Link from "next/link";
import { FaMagnifyingGlass } from "react-icons/fa6";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Busca: "${q}"` : "Busca",
    robots: { index: false, follow: false },
  };
}

export default async function BuscaPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="px-4 pt-6 pb-24 flex flex-col gap-6">
        <h1 className="text-[var(--text-primary)] font-bold text-xl">Busca</h1>
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
          <FaMagnifyingGlass size={36} />
          <p className="text-sm">Digite algo para buscar</p>
        </div>
      </div>
    );
  }

  // Busca em paralelo: cache local (Supabase) + TMDB
  const [cached, tmdbData] = await Promise.all([
    cacheService.search(query),
    tmdbService.searchSeries(query),
  ]);

  const cachedSeriesIds = new Set(cached.series.map((s: any) => s.id));
  // Séries do TMDB que ainda não estão no cache
  const tmdbSeries = (tmdbData.results ?? []).filter(
    (s: any) => !cachedSeriesIds.has(s.id)
  );

  const totalCount = cached.series.length + tmdbSeries.length + cached.episodes.length;

  return (
    <div className="px-4 pt-6 pb-24 flex flex-col gap-8">
      <div>
        <h1 className="text-[var(--text-primary)] font-bold text-xl">
          Resultados para &ldquo;{query}&rdquo;
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          {totalCount} resultado{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      {totalCount === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
          <FaMagnifyingGlass size={36} />
          <p className="text-sm">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Episódios do cache */}
      {cached.episodes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Episódios
          </h2>
          <div className="flex flex-col gap-2">
            {cached.episodes.map((ep: any) => {
              const s = ep.series as any;
              return (
                <Link
                  key={ep.id}
                  href={`/series/${s.slug}/temporada-${ep.season_number}/episodio-${ep.episode_number}-${ep.slug.replace(/^episodio-\d+-/, "")}`}
                  className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-[var(--yellow)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--yellow)] font-medium">{s.name}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      &ldquo;{ep.name}&rdquo;
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.season_number).padStart(2, "0")} · E{String(ep.episode_number).padStart(2, "0")}
                    </p>
                  </div>
                  <span className="text-[var(--text-muted)]">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Séries */}
      {(cached.series.length > 0 || tmdbSeries.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Séries
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Do cache */}
            {cached.series.map((series: any) => (
              <SeriesCard
                key={series.id}
                slug={series.slug}
                name={series.name}
                posterPath={series.poster_path}
              />
            ))}
            {/* Do TMDB */}
            {tmdbSeries.map((series: any) => (
              <SeriesCard
                key={series.id}
                slug={`${series.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${series.id}`}
                name={series.name}
                posterPath={series.poster_path}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SeriesCard({
  slug,
  name,
  posterPath,
}: {
  slug: string;
  name: string;
  posterPath: string | null;
}) {
  return (
    <Link href={`/series/${slug}`} className="flex flex-col gap-2 group">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${posterPath}`}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs text-center px-2">
            Sem imagem
          </div>
        )}
      </div>
      <p className="text-[var(--text-primary)] text-sm font-medium leading-snug line-clamp-2">
        {name}
      </p>
    </Link>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { seriesSlug } from "@/lib/slugs";
import { FavoriteButton } from "@/components/FavoriteButton/FavoriteButton";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

interface Genre {
  id: number;
  name: string;
}

interface Series {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string | null;
}

interface Props {
  providers: Provider[];
  genres: Genre[];
  initialSeries: Series[];
  initialTotalPages: number;
}

const SORT_OPTIONS = [
  { value: "popularity.desc",      label: "Mais populares" },
  { value: "vote_average.desc",    label: "Mais bem avaliadas" },
  { value: "first_air_date.desc",  label: "Lançamentos" },
];

export function SeriesBrowser({ providers, genres, initialSeries, initialTotalPages }: Props) {
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [selectedGenre, setSelectedGenre]       = useState<number | null>(null);
  const [sortBy, setSortBy]                     = useState("popularity.desc");
  const [series, setSeries]                     = useState<Series[]>(initialSeries);
  const [page, setPage]                         = useState(1);
  const [totalPages, setTotalPages]             = useState(initialTotalPages);
  const [loading, setLoading]                   = useState(false);
  const [loadingMore, setLoadingMore]           = useState(false);

  const fetchSeries = useCallback(async (pg: number, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg.toString(), sortBy });
      if (selectedProvider) params.set("providerId", selectedProvider.toString());
      if (selectedGenre)    params.set("genreId",    selectedGenre.toString());

      const res  = await fetch(`/api/discover?${params}`);
      const data = await res.json();
      setSeries((prev) => append ? [...prev, ...data.results] : data.results);
      setTotalPages(data.total_pages);
      setPage(pg);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedProvider, selectedGenre, sortBy]);

  // Reset + refetch when filters change
  useEffect(() => {
    fetchSeries(1, false);
  }, [selectedProvider, selectedGenre, sortBy]);  // eslint-disable-line react-hooks/exhaustive-deps

  const toggleProvider = (id: number) =>
    setSelectedProvider((prev) => (prev === id ? null : id));

  const toggleGenre = (id: number) =>
    setSelectedGenre((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-5">

      {/* Streaming providers */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Plataforma
        </p>
        <div className="flex gap-3 overflow-x-auto pt-2 pb-2 scrollbar-none">
          {providers.map((p) => (
            <button
              key={p.provider_id}
              onClick={() => toggleProvider(p.provider_id)}
              title={p.provider_name}
              className={`shrink-0 flex flex-col items-center gap-1.5 transition-all ${
                selectedProvider === p.provider_id ? "opacity-100 scale-110" : "opacity-50 hover:opacity-80"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl overflow-hidden relative ring-2 transition-all ${
                selectedProvider === p.provider_id
                  ? "ring-[var(--yellow)]"
                  : "ring-transparent"
              }`}>
                <Image
                  src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                  alt={p.provider_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <span className="text-[9px] text-[var(--text-muted)] max-w-[48px] text-center leading-tight truncate">
                {p.provider_name.replace(" Plus", "+").replace(" Video", "")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Genre + Sort */}
      <div className="flex flex-col gap-3">
        {/* Sort */}
        <div className="flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sortBy === opt.value
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedGenre === g.id
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter summary */}
      {(selectedProvider || selectedGenre) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">Filtros:</span>
          {selectedProvider && (
            <button
              onClick={() => setSelectedProvider(null)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)]"
            >
              {providers.find((p) => p.provider_id === selectedProvider)?.provider_name} ×
            </button>
          )}
          {selectedGenre && (
            <button
              onClick={() => setSelectedGenre(null)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)]"
            >
              {genres.find((g) => g.id === selectedGenre)?.name} ×
            </button>
          )}
          <button
            onClick={() => { setSelectedProvider(null); setSelectedGenre(null); }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9 gap-x-4 gap-y-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
          ))}
        </div>
      ) : series.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-3xl mb-3">📺</p>
          <p className="text-sm">Nenhuma série encontrada com esses filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-9 gap-x-4 gap-y-6">
          {series.map((s) => {
            const slug = seriesSlug(s.name, s.id);
            const year = s.first_air_date?.split("-")[0];
            return (
              <div key={s.id} className="relative group">
                <Link href={`/series/${slug}`} className="block">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
                    {s.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w342${s.poster_path}`}
                        alt={s.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-xs text-center px-2">
                        {s.name}
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Rating badge */}
                    {s.vote_average > 0 && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-[var(--yellow)]">
                        ★ {s.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Favorite button */}
                <div className="absolute top-2 right-2">
                  <FavoriteButton
                    series={{ id: s.id, name: s.name, slug, poster_path: s.poster_path }}
                    compact
                  />
                </div>

                {/* Title + year */}
                <div className="mt-2 px-0.5">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate leading-snug">
                    {s.name}
                  </p>
                  {year && (
                    <p className="text-[10px] text-[var(--text-muted)]">{year}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {!loading && page < totalPages && (
        <button
          onClick={() => fetchSeries(page + 1, true)}
          disabled={loadingMore}
          className="w-full py-3 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--yellow)] hover:text-[var(--yellow)] transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Carregando..." : "Carregar mais"}
        </button>
      )}
    </div>
  );
}

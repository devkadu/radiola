"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

interface TrendingSeason {
  key: string;
  seriesName: string;
  season: number;
  posterPath: string | null;
  href: string;
  score: number;
}

function Skeleton() {
  return (
    <div className="shrink-0 w-52 lg:w-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex gap-3 animate-pulse">
      <div className="w-10 h-14 rounded-lg bg-[var(--bg-elevated)] shrink-0" />
      <div className="flex flex-col gap-2 justify-center flex-1">
        <div className="h-3 bg-[var(--bg-elevated)] rounded w-3/4" />
        <div className="h-2.5 bg-[var(--bg-elevated)] rounded w-1/2" />
      </div>
    </div>
  );
}

export const TrendingSeasons = () => {
  const { data: seasons = [], isLoading } = useQuery<TrendingSeason[]>({
    queryKey: ["trending-seasons"],
    queryFn: () => fetch("/api/trending-seasons").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoading && seasons.length === 0) return null;

  return (
    <section className="px-4 lg:px-0 py-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Temporadas em alta</h2>
        <Link
          href="/series"
          className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors"
        >
          Ver mais →
        </Link>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">Salte direto para a temporada certa</p>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 w-52 lg:w-auto">
                <Skeleton />
              </div>
            ))
          : seasons.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="shrink-0 w-52 lg:w-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-3 hover:border-[var(--yellow)] transition-colors"
              >
                <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
                  {s.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${s.posterPath}`}
                      alt={s.seriesName}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] truncate">
                    {s.seriesName}
                  </p>
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                    Temporada {s.season}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {s.score} interaç{s.score === 1 ? "ão" : "ões"}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
};

"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

const toSlug = (name: string, id: number) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`;

function SeriesSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse">
      <div className="w-full aspect-[2/3] bg-[var(--bg-elevated)]" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-[var(--bg-elevated)] rounded w-3/4" />
        <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/3" />
      </div>
    </div>
  );
}

export const PopularSeries = () => {
  const { data: series = [], isLoading: loading } = useQuery<any[]>({
    queryKey: ["popular-series"],
    queryFn: () => fetch("/api/popular-series").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Favoritas da comunidade
        </p>
        <Link href="/series" className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors shrink-0">
          Ver todas →
        </Link>
      </div>

      {/* Grid */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[calc((100vw-3.5rem)/2.5)] lg:w-auto">
                <SeriesSkeleton />
              </div>
            ))
          : series.slice(0, 8).map((s: any) => (
              <Link
                key={s.id}
                href={`/series/${toSlug(s.name, s.id)}`}
                className="shrink-0 w-[calc((100vw-3.5rem)/2.5)] lg:w-auto rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--yellow)] transition-colors"
              >
                <div className="relative w-full aspect-[2/3]">
                  {s.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
                      alt={s.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 25vw, 160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-3xl">
                      📺
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{s.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {s.favorite_count} {s.favorite_count === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
};

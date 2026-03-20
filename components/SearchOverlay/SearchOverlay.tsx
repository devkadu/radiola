"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import { useSearchOverlay } from "@/context/SearchContext";

interface SearchResult {
  series: { id: number; name: string; slug: string; poster_path: string | null }[];
  episodes: {
    id: number;
    name: string;
    slug: string;
    season_number: number;
    episode_number: number;
    series: { id: number; name: string; slug: string };
  }[];
}

function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult | null>(null);
  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  return results;
}

export const SearchOverlay = () => {
  const { isOpen, close } = useSearchOverlay();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useSearch(query);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      close();
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") close();
  };

  const onSelect = () => close();

  const hasResults = results && (results.series.length > 0 || results.episodes.length > 0);

  return (
    <div className={`fixed inset-0 z-50 bg-[var(--bg)] flex flex-col transition-all duration-300 ${
      isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
    }`}>
      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[4px] px-3 py-2 flex-1">
          <FaMagnifyingGlass size={13} className="text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar série ou episódio..."
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-[var(--text-muted)] shrink-0">
              <FaXmark size={13} />
            </button>
          )}
        </div>
        <button onClick={close} className="text-sm text-[var(--text-secondary)] shrink-0">
          Cancelar
        </button>
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto">
        {!results && query.length < 2 && (
          <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
            <FaMagnifyingGlass size={32} />
            <p className="text-sm">Digite para buscar</p>
          </div>
        )}

        {results && !hasResults && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">Nenhum resultado encontrado</p>
          </div>
        )}

        {results && results.episodes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">
              Episódios
            </p>
            {results.episodes.map((ep, i) => {
              const s = ep.series as any;
              return (
                <Link
                  key={ep.id}
                  href={`/series/${s.slug}/temporada-${ep.season_number}/episodio-${ep.episode_number}-${ep.slug.replace(/^episodio-\d+-/, "")}`}
                  onClick={onSelect}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--yellow)] truncate">{s.name}</p>
                    <p className="text-sm text-[var(--text-primary)] truncate">&ldquo;{ep.name}&rdquo;</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.season_number).padStart(2, "0")} · E{String(ep.episode_number).padStart(2, "0")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {results && results.series.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">
              Séries
            </p>
            {results.series.map((series, i) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                onClick={onSelect}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
              >
                <div className="w-12 h-16 rounded overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative">
                  {series.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                      alt={series.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-elevated)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--text-primary)] truncate">{series.name}</p>
              </Link>
            ))}
          </div>
        )}

        {hasResults && (
          <Link
            href={`/busca?q=${encodeURIComponent(query)}`}
            onClick={onSelect}
            className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--yellow)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Ver todos os resultados para &ldquo;{query}&rdquo; →
          </Link>
        )}
      </div>
    </div>
  );
};

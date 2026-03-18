"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import Image from "next/image";

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

function SearchResults({
  query,
  results,
  onSelect,
}: {
  query: string;
  results: SearchResult;
  onSelect: () => void;
}) {
  const hasResults = results.series.length > 0 || results.episodes.length > 0;

  if (!hasResults) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Nenhum resultado encontrado</p>
      </div>
    );
  }

  return (
    <>
      {results.episodes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">
            Episódios
          </p>
          {results.episodes.map((ep) => {
            const s = ep.series as any;
            return (
              <Link
                key={ep.id}
                href={`/series/${s.slug}/temporada-${ep.season_number}/episodio-${ep.episode_number}-${ep.slug.replace(/^episodio-\d+-/, "")}`}
                onClick={onSelect}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
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

      {results.series.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">
            Séries
          </p>
          {results.series.map((series) => (
            <Link
              key={series.id}
              href={`/series/${series.slug}`}
              onClick={onSelect}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="w-8 h-12 rounded overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative">
                {series.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                    alt={series.name}
                    fill
                    className="object-cover"
                    sizes="32px"
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

      <Link
        href={`/busca?q=${encodeURIComponent(query)}`}
        onClick={onSelect}
        className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--yellow)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        Ver todos os resultados para &ldquo;{query}&rdquo; →
      </Link>
    </>
  );
}

export const Header = () => {
  const router = useRouter();

  // Desktop
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const results = useSearch(query);

  // Mobile overlay
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const mobileResults = useSearch(mobileQuery);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Foca input ao abrir overlay mobile
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50);
    } else {
      setMobileQuery("");
    }
  }, [mobileOpen]);

  const handleDesktopKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setDropdownOpen(false);
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") setDropdownOpen(false);
  };

  const handleMobileKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobileQuery.trim()) {
      setMobileOpen(false);
      router.push(`/busca?q=${encodeURIComponent(mobileQuery.trim())}`);
    }
    if (e.key === "Escape") setMobileOpen(false);
  };

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-[1296px] mx-auto flex items-center px-4 py-3 gap-3">
          <Link href="/" className="text-3xl font-bold tracking-tight text-[var(--text-primary)] shrink-0">
            radio<span className="text-[var(--yellow)]">la</span>
          </Link>

          {/* Busca desktop */}
          <div ref={wrapperRef} className="relative flex-1 hidden sm:block">
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[4px] px-3 py-2">
              <FaMagnifyingGlass size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Buscar série ou episódio..."
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-full"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                onKeyDown={handleDesktopKeyDown}
                onFocus={() => results && setDropdownOpen(true)}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setDropdownOpen(false); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                >
                  <FaXmark size={13} />
                </button>
              )}
            </div>

            {dropdownOpen && results && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[4px] z-50 overflow-hidden shadow-xl">
                <SearchResults
                  query={query}
                  results={results}
                  onSelect={() => { setQuery(""); setDropdownOpen(false); }}
                />
              </div>
            )}
          </div>

          {/* Ícone de busca mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="sm:hidden ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FaMagnifyingGlass size={18} />
          </button>

          <button className="text-sm px-4 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-white/10 transition-colors shrink-0">
            Entrar
          </button>
        </div>
      </header>

      {/* Overlay de busca mobile */}
      <div className={`fixed inset-0 z-50 bg-[var(--bg)] flex flex-col sm:hidden transition-all duration-300 ${mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
          {/* Topo */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[4px] px-3 py-2 flex-1">
              <FaMagnifyingGlass size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder="Buscar série ou episódio..."
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-full"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                onKeyDown={handleMobileKeyDown}
              />
              {mobileQuery && (
                <button
                  onClick={() => setMobileQuery("")}
                  className="text-[var(--text-muted)] shrink-0"
                >
                  <FaXmark size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="text-sm text-[var(--text-secondary)] shrink-0"
            >
              Cancelar
            </button>
          </div>

          {/* Resultados */}
          <div className="flex-1 overflow-y-auto">
            {mobileResults && (
              <SearchResults
                query={mobileQuery}
                results={mobileResults}
                onSelect={() => setMobileOpen(false)}
              />
            )}
            {!mobileResults && mobileQuery.length < 2 && (
              <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
                <FaMagnifyingGlass size={32} />
                <p className="text-sm">Digite para buscar</p>
              </div>
            )}
          </div>
        </div>
    </>
  );
};

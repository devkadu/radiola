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

interface SmartAnswer {
  type: string;
  answer: string;
  seriesName: string;
  tags: string[];
}

function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [smart, setSmart] = useState<SmartAnswer | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults(null); setSmart(null); return; }

    const timer = setTimeout(async () => {
      const [regularRes, smartRes] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
        fetch(`/api/smart-search?q=${encodeURIComponent(query)}`).then(r => r.json()),
      ]);
      setResults(regularRes);
      setSmart(smartRes.smartAnswer ?? null);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, smart };
}

const INTENT_LABEL: Record<string, string> = {
  material: "📖 material original",
  prod_status: "📺 status de produção",
  similares: "✨ você também vai amar",
  discovery: "🎯 pra você assistir",
};

// Renderiza markdown bold simples (**texto**)
function SmartText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="text-[var(--text-primary)] font-semibold">{p}</strong> : p
      )}
    </span>
  );
}

export const SearchOverlay = () => {
  const { isOpen, initialQuery, close } = useSearchOverlay();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, smart } = useSearch(query);

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen, initialQuery]);

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
            placeholder="Buscar série, humor, gênero..."
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

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">

        {/* Estado vazio */}
        {!results && !smart && query.length < 2 && (
          <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
            <FaMagnifyingGlass size={32} />
            <p className="text-sm">Digite para buscar</p>
          </div>
        )}

        {/* Zona A — Resposta inteligente */}
        {smart && (
          <div className="mx-4 mt-4 rounded-2xl border border-[var(--yellow)]/20 bg-[var(--yellow)]/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] mb-2">
              ✨ {INTENT_LABEL[smart.type] ?? "resposta rápida"}
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mb-1">
              <SmartText text={smart.answer} />
            </p>
            {smart.series && smart.series.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {smart.series.map((s) => (
                  <Link key={s.id} href={`/series/${s.slug}`} onClick={onSelect} className="shrink-0 flex flex-col gap-1 w-16">
                    <div className="w-16 h-24 rounded-lg overflow-hidden bg-[var(--bg-elevated)] relative">
                      {s.poster_path ? (
                        <Image src={`https://image.tmdb.org/t/p/w154${s.poster_path}`} alt={s.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full bg-[var(--bg-elevated)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] text-center line-clamp-2 leading-tight">{s.name}</p>
                  </Link>
                ))}
              </div>
            )}
            {smart.tags.length > 0 && !smart.series && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {smart.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Zona B — Resultados de navegação */}
        {results && !hasResults && !smart && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">Nenhum resultado encontrado</p>
          </div>
        )}

        {results?.episodes && results.episodes.length > 0 && (
          <div className="mt-2">
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

        {results?.series && results.series.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">
              Séries
            </p>
            {results.series.map((s, i) => (
              <Link
                key={s.id}
                href={`/series/${s.slug}`}
                onClick={onSelect}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
              >
                <div className="w-10 h-14 rounded overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative">
                  {s.poster_path ? (
                    <Image src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} alt={s.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-elevated)]" />
                  )}
                </div>
                <p className="text-sm text-[var(--text-primary)] truncate">{s.name}</p>
              </Link>
            ))}
          </div>
        )}

        {hasResults && (
          <Link
            href={`/busca?q=${encodeURIComponent(query)}`}
            onClick={onSelect}
            className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--yellow)] hover:bg-[var(--bg-elevated)] transition-colors mt-2"
          >
            Ver todos os resultados para &ldquo;{query}&rdquo; →
          </Link>
        )}
      </div>
    </div>
  );
};

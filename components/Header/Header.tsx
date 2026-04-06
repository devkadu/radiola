"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSearchOverlay } from "@/context/SearchContext";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import Image from "next/image";

const Avatar = ({ avatarUrl, initials }: { avatarUrl: string | null; initials?: string }) => (
  <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[var(--yellow)] flex items-center justify-center text-xs font-bold text-black">
    {avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    ) : initials}
  </div>
);

interface SearchResult {
  series: { id: number; name: string; slug: string; poster_path: string | null }[];
  episodes: {
    id: number; name: string; slug: string;
    season_number: number; episode_number: number;
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

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { open } = useSearchOverlay();
  const username = user?.user_metadata?.username || user?.email?.split("@")[0];
  const initials = username?.slice(0, 2).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;

  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const results = useSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setDropdownOpen(false);
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === "Escape") setDropdownOpen(false);
  };

  const onSelect = () => { setQuery(""); setDropdownOpen(false); };

  if (pathname !== "/") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="flex items-center px-4 py-3 gap-3">
        {/* Logo — só no mobile */}
        <Link href="/" className="lg:hidden flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-[var(--yellow)] rounded-[8px] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
              <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
              <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Segunda<br/>Temporada
          </span>
        </Link>

        {/* Desktop: busca ocupa da metade até os botões */}
        <div className="hidden lg:flex flex-1 items-center gap-3 justify-end">
          <div ref={wrapperRef} className="relative w-1/2">
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[4px] px-3 py-2">
              <FaMagnifyingGlass size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Buscar série ou episódio..."
                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none w-full"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                onKeyDown={handleKeyDown}
                onFocus={() => results && setDropdownOpen(true)}
              />
              {query && (
                <button onClick={() => { setQuery(""); setDropdownOpen(false); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
                  <FaXmark size={13} />
                </button>
              )}
            </div>

            {dropdownOpen && results && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[4px] z-50 overflow-hidden shadow-xl">
                {results.series.length === 0 && results.episodes.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] px-4 py-6 text-center">Nenhum resultado encontrado</p>
                ) : (
                  <>
                    {results.episodes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">Episódios</p>
                        {results.episodes.map((ep, i) => {
                          const s = ep.series as any;
                          return (
                            <Link key={ep.id} href={`/series/${s.slug}/temporada-${ep.season_number}/episodio-${ep.episode_number}-${ep.slug.replace(/^episodio-\d+-/, "")}`}
                              onClick={onSelect}
                              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--yellow)] truncate">{s.name}</p>
                                <p className="text-sm text-[var(--text-primary)] truncate">&ldquo;{ep.name}&rdquo;</p>
                                <p className="text-xs text-[var(--text-muted)]">T{String(ep.season_number).padStart(2,"0")} · E{String(ep.episode_number).padStart(2,"0")}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    {results.series.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-4 pt-3 pb-1">Séries</p>
                        {results.series.map((s, i) => (
                          <Link key={s.id} href={`/series/${s.slug}`} onClick={onSelect}
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-elevated)] transition-colors ${i > 0 ? "border-t border-[var(--border)]" : ""}`}
                          >
                            <div className="w-12 h-16 rounded overflow-hidden bg-[var(--bg-elevated)] shrink-0 relative">
                              {s.poster_path ? (
                                <Image src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} alt={s.name} fill className="object-cover" sizes="48px" />
                              ) : <div className="w-full h-full bg-[var(--bg-elevated)]" />}
                            </div>
                            <p className="text-sm text-[var(--text-primary)] truncate">{s.name}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href={`/busca?q=${encodeURIComponent(query)}`} onClick={onSelect}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--yellow)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      Ver todos os resultados para &ldquo;{query}&rdquo; →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {user ? (
            <Link href="/perfil" className="hover:opacity-80 active:opacity-50 transition-opacity shrink-0">
              <Avatar avatarUrl={avatarUrl} initials={initials} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm px-4 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-white/10 transition-colors shrink-0">
                Entrar
              </Link>
              <Link href="/criar-conta" className="text-sm px-4 py-1.5 rounded-full bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors shrink-0">
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Mobile: ícone de busca + auth */}
        <div className="lg:hidden ml-auto flex items-center gap-3">
          <button onClick={open} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <FaMagnifyingGlass size={18} />
          </button>
          {user ? (
            <Link href="/perfil" className="hover:opacity-80 active:opacity-50 transition-opacity shrink-0">
              <Avatar avatarUrl={avatarUrl} initials={initials} />
            </Link>
          ) : (
            <Link href="/login" className="text-sm px-4 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-white/10 transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchOverlay } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";
import { FiSearch } from "react-icons/fi";
import { FaBell } from "react-icons/fa6";
import { NextEpisodeCard } from "./NextEpisodeCard";

interface NextEpisode {
  seriesId: number;
  seriesName: string;
  seriesHref: string;
  episodeName: string;
  seasonNumber: number;
  episodeNumber: number;
  still_path: string | null;
  poster_path: string | null;
  href: string;
  isUpcoming: boolean;
  airDate: string | null;
}

interface Props {
  username: string;
}

export function PersonalizedHome({ username }: Props) {
  const { open } = useSearchOverlay();
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<NextEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = username.slice(0, 2).toUpperCase();
  const firstName = username.split(" ")[0];

  useEffect(() => {
    fetch("/api/profile/next-episodes")
      .then((r) => r.json())
      .then((data) => { setEpisodes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleWatched = (seriesId: number) => {
    setEpisodes((prev) => prev.filter((e) => e.seriesId !== seriesId));
  };

  return (
    <div className="flex flex-col">
      {/* Top bar mobile */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
            Olá, <span style={{ color: "#A0C830" }}>{firstName}</span> 👋
          </h1>
          <p className="text-xs text-[var(--text-muted)]">O que vamos assistir hoje?</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-[var(--text-muted)]">
            <FaBell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#A0C830]" />
          </button>
          <Link href="/perfil">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#A0C830] flex items-center justify-center text-xs font-bold text-black shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : initials}
            </div>
          </Link>
        </div>
      </div>

      {/* Desktop: saudação */}
      <div className="hidden lg:block px-0 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Olá, <span style={{ color: "#A0C830" }}>{firstName}</span> 👋
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">O que vamos assistir hoje?</p>
      </div>

      <div className="px-4 lg:px-0 flex flex-col gap-6 pb-6">
        {/* Busca */}
        <button
          onClick={() => open()}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[#A0C830]/40 transition-colors text-left"
        >
          <FiSearch size={15} className="shrink-0" />
          buscar série, humor, gênero…
        </button>

        {/* Seção: Onde você parou */}
        <div className="flex flex-col gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">onde você parou</h2>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[88px] rounded-2xl bg-[var(--bg-elevated)] animate-pulse" />
              ))}
            </div>
          ) : episodes.length > 0 ? (
            <>
              <div className="flex flex-col gap-2">
                {episodes.map((ep) => (
                  <NextEpisodeCard key={ep.seriesId} episode={ep} onWatched={handleWatched} />
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] text-center lg:hidden mt-1">
                ← arraste para marcar como assistido
              </p>
            </>
          ) : (
            <div className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">Nenhuma série na sua lista ainda.</p>
              <Link href="/series" className="text-xs text-[#A0C830] mt-1 block">Explorar séries →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

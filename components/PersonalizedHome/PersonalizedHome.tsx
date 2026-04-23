"use client";

import { useEffect, useState } from "react";
import { useSearchOverlay } from "@/context/SearchContext";
import { FiSearch } from "react-icons/fi";
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
  const [episodes, setEpisodes] = useState<NextEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/next-episodes")
      .then((r) => r.json())
      .then((data) => { setEpisodes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleWatched = (seriesId: number) => {
    setEpisodes((prev) => prev.filter((e) => e.seriesId !== seriesId));
  };

  const firstName = username.split(" ")[0];

  return (
    <div className="px-4 lg:px-0 pt-6 pb-4 flex flex-col gap-6">
      {/* Saudação + busca */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Olá, <span className="text-[var(--yellow)]">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">O que vamos assistir hoje?</p>
        </div>

        <button
          onClick={() => open()}
          className="flex items-center gap-2 w-full max-w-sm px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--yellow)]/40 transition-colors text-left"
        >
          <FiSearch size={15} className="shrink-0" />
          buscar série, humor, gênero…
        </button>
      </div>

      {/* Lista de próximos episódios */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--bg-elevated)] animate-pulse" />
          ))}
        </div>
      ) : episodes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">continuar assistindo</h2>
          <div className="flex flex-col gap-2">
            {episodes.map((ep) => (
              <NextEpisodeCard key={ep.seriesId} episode={ep} onWatched={handleWatched} />
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1 lg:hidden text-center">← arraste para marcar como assistido</p>
        </div>
      ) : (
        <div className="text-center py-8 text-[var(--text-muted)]">
          <p className="text-sm">Nenhuma série na sua lista ainda.</p>
          <p className="text-xs mt-1">Adicione séries para acompanhar aqui.</p>
        </div>
      )}
    </div>
  );
}

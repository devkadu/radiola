"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaCheck } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { watchedEpisodesService } from "@/services/watchedEpisodes";

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
  episode: NextEpisode;
  onWatched: (seriesId: number) => void;
}

export function NextEpisodeCard({ episode, onWatched }: Props) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [marking, setMarking] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const markWatched = async () => {
    if (marking || !user) return;
    setMarking(true);
    const epId = `${episode.seriesId}-s${episode.seasonNumber}-e${episode.episodeNumber}`;
    await watchedEpisodesService.markWatched(user.id, epId);
    setDismissed(true);
    onWatched(episode.seriesId);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setSwipeX(dx);
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (swipeX < -80) {
      markWatched();
    } else {
      setSwipeX(0);
    }
    touchStartX.current = null;
  };

  if (dismissed) return null;

  const image = episode.still_path
    ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
    : episode.poster_path
    ? `https://image.tmdb.org/t/p/w185${episode.poster_path}`
    : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]"
      style={{
        transform: `translateX(${swipeX}px)`,
        transition: swiping ? "none" : "transform 0.3s ease, opacity 0.3s ease",
        opacity: dismissed ? 0 : 1,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Hint de swipe no mobile */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--yellow)] text-xs font-semibold pointer-events-none lg:hidden"
        style={{ opacity: Math.min(1, Math.abs(swipeX) / 60) }}
      >
        <FaCheck size={12} />
        assistido
      </div>

      <Link href={episode.href} className="flex h-[96px] relative">
        {/* Imagem — ocupa 45% */}
        <div className="relative w-[45%] shrink-0 overflow-hidden rounded-l-2xl">
          {image ? (
            <Image src={image} alt={episode.episodeName} fill className="object-cover" sizes="45vw" />
          ) : (
            <div className="w-full h-full bg-[var(--bg-surface)]" />
          )}
          {/* Gradiente de fade para o conteúdo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[var(--bg-elevated)]" />
        </div>

        {/* Info — a partir de 40% */}
        <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
          <p className="text-[11px] text-[var(--yellow)] font-semibold truncate">{episode.seriesName}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate mt-0.5">{episode.episodeName}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            T{String(episode.seasonNumber).padStart(2, "0")} · E{String(episode.episodeNumber).padStart(2, "0")}
            {episode.isUpcoming && episode.airDate && (
              <span className="ml-2 text-[var(--yellow)]">• estreia {new Date(episode.airDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
            )}
          </p>
        </div>

        {/* Botão desktop — só aparece no hover */}
        {!episode.isUpcoming && (
          <button
            onClick={(e) => { e.preventDefault(); markWatched(); }}
            disabled={marking}
            className="hidden lg:flex items-center gap-1.5 shrink-0 mr-3 self-center px-3 py-1.5 rounded-full bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20 text-[var(--yellow)] text-xs font-semibold transition-colors"
          >
            <FaCheck size={10} />
            {marking ? "..." : "assistido"}
          </button>
        )}
      </Link>
    </div>
  );
}

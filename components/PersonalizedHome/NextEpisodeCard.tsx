"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { watchedEpisodesService } from "@/services/watchedEpisodes";
import { WatchedBottomSheet } from "./WatchedBottomSheet";

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
  commentCount?: number;
}

interface Props {
  episode: NextEpisode;
  onWatched: (seriesId: number) => void;
}

const SWIPE_THRESHOLD = 60;

export function NextEpisodeCard({ episode, onWatched }: Props) {
  const { user } = useAuth();
  const [watched, setWatched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const epId = `${episode.seriesId}-s${episode.seasonNumber}-e${episode.episodeNumber}`;
  const epLabel = `T${String(episode.seasonNumber).padStart(2, "0")}·E${String(episode.episodeNumber).padStart(2, "0")}`;

  const handleMarkWatched = async () => {
    if (!user || watched) return;
    setWatched(true);
    await watchedEpisodesService.markWatched(user.id, epId);
    setTimeout(() => setSheetOpen(true), 120);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -120));
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (swipeX < -SWIPE_THRESHOLD) {
      setSwipeX(-120);
      handleMarkWatched();
    } else {
      setSwipeX(0);
    }
    touchStartX.current = null;
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    onWatched(episode.seriesId);
  };

  const image = episode.still_path
    ? `https://image.tmdb.org/t/p/w300${episode.still_path}`
    : episode.poster_path
    ? `https://image.tmdb.org/t/p/w185${episode.poster_path}`
    : null;

  const swipeProgress = Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD);

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Fundo swipe */}
        <div
          className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
          style={{ background: `rgba(160,200,48,${swipeProgress * 0.2})` }}
        >
          <div className="flex items-center gap-1.5" style={{ opacity: swipeProgress }}>
            <div className="w-5 h-5 rounded-full bg-[#A0C830] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-[#A0C830]">assistido</span>
          </div>
        </div>

        {/* Card */}
        <div
          className="relative rounded-xl border border-[var(--border)] overflow-hidden"
          style={{
            background: watched ? "#0f1a0c" : "var(--bg-elevated)",
            transform: `translateX(${swipeX}px)`,
            transition: swiping ? "none" : "transform 0.3s ease",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Link href={episode.href} className="flex h-[72px]">
            <div className="relative w-[100px] shrink-0 overflow-hidden">
              {image ? (
                <Image src={image} alt={episode.episodeName} fill className="object-cover" sizes="140px" />
              ) : (
                <div className="w-full h-full bg-[var(--bg-surface)]" />
              )}

              {/* Gradiente fade para o conteúdo */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(to right, transparent 50%, var(--bg-elevated) 100%)"
              }} />

              {/* Overlay + check quando assistido */}
              {watched && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-[#A0C830] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Barra de progresso */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: watched ? "100%" : "0%", background: "#A0C830" }}
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-center px-3 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "#A0C830" }}>
                {episode.seriesName}
              </p>
              <p
                className="text-sm font-semibold truncate mt-0.5 transition-colors"
                style={{ color: watched ? "rgba(255,255,255,0.35)" : "var(--text-primary)" }}
              >
                {episode.episodeName}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] text-[var(--text-muted)]">{epLabel}</span>
                {(episode.commentCount ?? 0) > 0 && (
                  <span className="text-[11px] text-[var(--text-muted)]">· {episode.commentCount} comentários</span>
                )}
                {episode.isUpcoming && episode.airDate && (
                  <span className="text-[11px] text-amber-400">
                    estreia {new Date(episode.airDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            </div>

            {/* Botão desktop */}
            {!episode.isUpcoming && !watched && (
              <button
                onClick={(e) => { e.preventDefault(); handleMarkWatched(); }}
                className="hidden lg:flex items-center gap-1.5 shrink-0 mr-3 self-center px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border border-[var(--border)] hover:border-[#A0C830]/50 hover:bg-[#A0C830]/10"
                style={{ color: "var(--text-muted)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                assistido
              </button>
            )}
          </Link>
        </div>
      </div>

      <WatchedBottomSheet
        open={sheetOpen}
        episodeId={epId}
        seriesName={episode.seriesName}
        episodeLabel={epLabel}
        onClose={handleSheetClose}
      />
    </>
  );
}

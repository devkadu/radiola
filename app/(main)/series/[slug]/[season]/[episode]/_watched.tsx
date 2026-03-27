"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { watchedEpisodesService } from "@/services/watchedEpisodes";

export function WatchedBadge({ episodeId }: { episodeId: string }) {
  const { user, loading } = useAuth();
  const [watched, setWatched] = useState<boolean | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setWatched(false); return; }
    watchedEpisodesService.isWatched(user.id, episodeId).then(setWatched);
  }, [user, loading, episodeId]);

  if (watched === null) return null;

  const mark = async () => {
    if (!user || marking || watched) return;
    setMarking(true);
    await watchedEpisodesService.markWatched(user.id, episodeId);
    setWatched(true);
    setMarking(false);
  };

  if (watched) {
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 border border-green-500/30 text-green-400">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Assistido
      </span>
    );
  }

  return (
    <button
      onClick={mark}
      disabled={marking}
      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)] transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      Marcar assistido
    </button>
  );
}

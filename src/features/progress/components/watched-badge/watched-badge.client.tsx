"use client";

import { useWatchedEpisode } from "../../hooks/use-watched-episode";

export function WatchedBadge({ episodeId }: { episodeId: string }) {
  const { watched, marking, mark, error } = useWatchedEpisode(episodeId);
  if (watched === null) return null;
  if (error) return <span role="alert" className="text-xs text-red-400">Não foi possível atualizar o episódio.</span>;

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

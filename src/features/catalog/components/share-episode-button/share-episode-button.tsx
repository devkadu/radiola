"use client";
import { useState } from "react";

interface ShareEpisodeButtonProps {
  seriesName: string;
  episodeName: string;
}

export function ShareEpisodeButton({ seriesName, episodeName }: ShareEpisodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Estou assistindo "${episodeName}" de ${seriesName} na Segunda Temporada 📺`;
    if (navigator.share) {
      await navigator.share({ title: "Segunda Temporada", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)] transition-colors"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

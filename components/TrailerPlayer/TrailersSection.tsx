"use client";

import { useState } from "react";
import { TrailerPlayer } from "./TrailerPlayer";

interface Video {
  key: string;
  name: string;
  type: string;
}

interface Props {
  trailers: Video[];
  seriesId: string;
}

export function TrailersSection({ trailers, seriesId }: Props) {
  const [selected, setSelected] = useState(0);
  const current = trailers[selected];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-bold text-[var(--text-primary)]">Trailers</h2>

      {/* Tabs de trailers */}
      {trailers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {trailers.map((v, i) => (
            <button
              key={v.key}
              onClick={() => setSelected(i)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                i === selected
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)] font-semibold"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              }`}
            >
              {v.name.length > 30 ? v.name.slice(0, 28) + "…" : v.name}
            </button>
          ))}
        </div>
      )}

      <TrailerPlayer
        key={current.key}
        youtubeKey={current.key}
        seriesId={seriesId}
      />
    </div>
  );
}

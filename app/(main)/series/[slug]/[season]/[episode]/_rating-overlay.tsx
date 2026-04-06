"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  episodeId: string;
}

export function EpisodeRatingOverlay({ episodeId }: Props) {
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("episode_reactions")
      .select("reaction_key")
      .eq("episode_id", episodeId)
      .then(({ data }) => {
        const nums = (data ?? [])
          .map((r) => parseInt(r.reaction_key))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 5);
        if (nums.length > 0) {
          setAvg(nums.reduce((a, b) => a + b, 0) / nums.length);
          setTotal(nums.length);
        }
        setLoaded(true);
      });
  }, [episodeId]);

  if (!loaded) return null;

  if (avg) {
    return (
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-sm font-bold text-white leading-none">{avg.toFixed(1)}</span>
        <span className="text-[10px] text-white/60 leading-none">({total})</span>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 right-3 flex flex-col items-end gap-0.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
      <div className="flex items-center gap-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--yellow)" stroke="var(--yellow)" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-sm font-bold text-white/50 leading-none">—</span>
      </div>
      <span className="text-[9px] text-white/50 leading-none">Seja o primeiro a avaliar</span>
    </div>
  );
}

"use client";

import { createClient } from "@/shared/lib/supabase-browser";
import { useEffect,useState } from "react";

interface Props {
  episodeId: string;
}

export const EpisodeRatingOverlay = ({ episodeId }: Props) => {
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [loadedEpisode, setLoadedEpisode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("episode_reactions")
      .select("reaction_key")
      .eq("episode_id", episodeId)
      .then(({ data, error }) => {
        if (!active) return;
        setLoadedEpisode(episodeId);
        if (error) {
          setUnavailable(true);
          setLoaded(true);
          return;
        }
        const nums = (data ?? [])
          .map((r) => Number(r.reaction_key))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
        setUnavailable(false);
        setAvg(null);
        setTotal(0);
        if (nums.length > 0) {
          setAvg(nums.reduce((a, b) => a + b, 0) / nums.length);
          setTotal(nums.length);
        }
        setLoaded(true);
      });
    return () => { active = false; };
  }, [episodeId]);

  if (!loaded || loadedEpisode !== episodeId) return null;
  if (unavailable) return <span className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-3 py-2 text-xs text-white">Avaliações indisponíveis</span>;

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

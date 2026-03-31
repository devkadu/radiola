"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";
import { LoginSheet } from "@/components/LoginSheet/LoginSheet";

interface Props {
  episodeId: string;
}

function Star({ filled, hovered, onClick, onEnter, onLeave, size = 32 }: {
  filled: boolean;
  hovered: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
  size?: number;
}) {
  const active = filled || hovered;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="p-1 transition-transform hover:scale-110 active:scale-95"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "var(--yellow)" : "none"} stroke={active ? "var(--yellow)" : "var(--border)"} strokeWidth="1.5" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

export const EpisodeReactions = ({ episodeId }: Props) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<number[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: all } = await supabase
        .from("episode_reactions")
        .select("reaction_key")
        .eq("episode_id", episodeId);

      const nums = (all ?? [])
        .map((r) => parseInt(r.reaction_key))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 5);
      setRatings(nums);

      if (user) {
        const { data: mine } = await supabase
          .from("episode_reactions")
          .select("reaction_key")
          .eq("episode_id", episodeId)
          .eq("user_id", user.id)
          .maybeSingle();
        const n = mine ? parseInt(mine.reaction_key) : NaN;
        setUserRating(!isNaN(n) && n >= 1 && n <= 5 ? n : null);
      }

      setLoading(false);
    };

    fetchData();
  }, [episodeId, user]);

  const handleRate = async (star: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (submitting) return;

    const isRemove = userRating === star;
    setSubmitting(true);

    const prevRatings = [...ratings];
    const prevUserRating = userRating;

    // Optimistic update
    const next = [...ratings];
    if (prevUserRating !== null) {
      const idx = next.indexOf(prevUserRating);
      if (idx !== -1) next.splice(idx, 1);
    }
    if (!isRemove) next.push(star);
    setRatings(next);
    setUserRating(isRemove ? null : star);

    try {
      const supabase = createClient();
      await supabase.from("episode_reactions").delete()
        .eq("episode_id", episodeId).eq("user_id", user.id);

      if (!isRemove) {
        const { error } = await supabase.from("episode_reactions").insert({
          episode_id: episodeId,
          user_id: user.id,
          reaction_key: String(star),
        });
        if (error) throw error;
      }
    } catch {
      setRatings(prevRatings);
      setUserRating(prevUserRating);
    } finally {
      setSubmitting(false);
    }
  };

  const total = ratings.length;
  const avg = total === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / total;
  if (loading) {
    return <div className="h-24 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse" />;
  }

  return (
    <>
    <LoginSheet
      show={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Entre para avaliar este episódio."
    />
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-4 flex flex-col gap-3">

        <p className="text-sm font-semibold text-[var(--text-primary)]">Avalie este episódio</p>

        <div className="flex items-center gap-0.5"
          onMouseLeave={() => setHovered(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              filled={star <= (userRating ?? 0)}
              hovered={hovered !== null && star <= hovered}
              onClick={() => handleRate(star)}
              onEnter={() => setHovered(star)}
              onLeave={() => {}}
            />
          ))}
          {userRating && (
            <span className="text-xs text-[var(--text-muted)] ml-2">
              sua nota: {userRating}/5
            </span>
          )}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xl font-bold text-[var(--yellow)] leading-none">{avg.toFixed(1)}</span>
            <span className="text-xs text-[var(--text-muted)]">/ 5</span>
            <span className="text-xs text-[var(--text-muted)]">· {total} avaliação{total !== 1 ? "ões" : ""}</span>
          </div>
        )}
      </div>
    </>
  );
};

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";

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
  const promptRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!showLoginPrompt) return;
    const handler = (e: MouseEvent) => {
      if (promptRef.current && !promptRef.current.contains(e.target as Node))
        setShowLoginPrompt(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLoginPrompt]);

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
  const displayUpTo = hovered ?? userRating ?? 0;

  if (loading) {
    return <div className="h-24 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse" />;
  }

  return (
    <div className="relative">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-4 flex flex-col gap-3">

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Avalie este episódio</p>
          {total > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              {total} avaliação{total !== 1 ? "ões" : ""}
            </span>
          )}
        </div>

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

        {total > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-[var(--yellow)] leading-none">
              {avg.toFixed(1)}
            </span>
            <div className="flex flex-col gap-0.5 flex-1">
              {/* Distribution bars */}
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratings.filter((r) => r === star).length;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[var(--text-muted)] w-3 text-right">{star}</span>
                    <div className="flex-1 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--yellow)] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--text-muted)] leading-tight">média</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-tight">Segunda Temporada</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">Seja o primeiro a avaliar</p>
        )}
      </div>

      {showLoginPrompt && (
        <div ref={promptRef} className="absolute left-0 right-0 top-full mt-2 z-50">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-4 shadow-lg">
            <p className="text-sm text-[var(--text-primary)] mb-3">Entre para avaliar este episódio.</p>
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/criar-conta"
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

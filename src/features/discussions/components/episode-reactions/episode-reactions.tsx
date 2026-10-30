"use client";

import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { LoginSheet } from "@/features/auth/components/login-sheet/login-sheet";
import { createClient } from "@/shared/lib/supabase-browser";
import { useEffect,useState } from "react";

interface Props {
  episodeId: string;
}

const Star = ({ filled, hovered, onClick, onEnter, onLeave, disabled, label, size = 32 }: {
  filled: boolean;
  hovered: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
  disabled: boolean;
  label: string;
  size?: number;
}) => {
  const active = filled || hovered;
  return (
    <button
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      disabled={disabled}
      aria-label={label}
      aria-pressed={filled}
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
  const [error, setError] = useState<string | null>(null);
  const [readError, setReadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const userId = user?.id;
  const loadKey = `${episodeId}:${userId ?? ""}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const [all, mine] = await Promise.all([
          supabase.from("episode_reactions").select("reaction_key").eq("episode_id", episodeId),
          userId
            ? supabase.from("episode_reactions").select("reaction_key").eq("episode_id", episodeId).eq("user_id", userId).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (all.error || mine.error) throw all.error ?? mine.error;
        if (!active) return;
        const nums = (all.data ?? []).map((r) => Number(r.reaction_key))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
        const n = Number(mine.data?.reaction_key);
        setRatings(nums);
        setUserRating(Number.isInteger(n) && n >= 1 && n <= 5 ? n : null);
        setReadError(false);
      } catch {
        if (active) setReadError(true);
      } finally {
        if (active) {
          setLoadedKey(loadKey);
          setLoading(false);
        }
      }
    };
    void fetchData();
    return () => { active = false; };
  }, [episodeId, userId, loadKey, attempt]);

  const handleRate = async (star: number) => {
    if (!user) { setShowLoginPrompt(true); return; }
    if (submitting) return;

    const isRemove = userRating === star;
    setSubmitting(true);
    setError(null);

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
      if (isRemove) {
        const { error } = await supabase.from("episode_reactions").delete()
          .eq("episode_id", episodeId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("episode_reactions").upsert({
          episode_id: episodeId,
          user_id: user.id,
          reaction_key: String(star),
        }, { onConflict: "user_id,episode_id" });
        if (error) throw error;
      }
    } catch {
      setError("Não foi possível salvar sua avaliação. Tente novamente.");
      setRatings(prevRatings);
      setUserRating(prevUserRating);
    } finally {
      setSubmitting(false);
    }
  };

  const total = ratings.length;
  const avg = total === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / total;
  if (loading || loadedKey !== loadKey) {
    return <div className="h-24 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse" />;
  }

  if (readError) return (
    <div role="alert" className="py-4 text-sm text-[var(--text-muted)]">
      <p>Não foi possível carregar as avaliações.</p>
      <button className="mt-2 text-[var(--yellow)] underline" onClick={() => {
        setLoading(true);
        setAttempt((value) => value + 1);
      }}>Tentar novamente</button>
    </div>
  );

  return (
    <>
    <LoginSheet
      show={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Entre para avaliar este episódio."
    />
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-4 flex flex-col gap-3">
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

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
              disabled={submitting}
              label={`Avaliar com ${star} de 5 estrelas`}
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

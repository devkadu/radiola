"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";

interface Props {
  episodeId: string;
}

const REACTIONS = [
  { key: "chocante",      emoji: "😱", label: "Chocante",      weight: 9.5 },
  { key: "incrivel",      emoji: "🔥", label: "Incrível",      weight: 9.0 },
  { key: "emocionante",   emoji: "💗", label: "Emocionante",   weight: 8.0 },
  { key: "surpreso",      emoji: "😮", label: "Surpreso",      weight: 6.5 },
  { key: "mediano",       emoji: "😐", label: "Mediano",       weight: 5.0 },
  { key: "decepcionante", emoji: "😞", label: "Decepcionante", weight: 2.0 },
];

type Counts = Record<string, number>;

export const EpisodeReactions = ({ episodeId }: Props) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Counts>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const { data: allReactions } = await supabase
        .from("episode_reactions")
        .select("reaction_key")
        .eq("episode_id", episodeId);

      const newCounts: Counts = {};
      for (const r of allReactions ?? []) {
        newCounts[r.reaction_key] = (newCounts[r.reaction_key] ?? 0) + 1;
      }
      setCounts(newCounts);

      if (user) {
        const { data: mine } = await supabase
          .from("episode_reactions")
          .select("reaction_key")
          .eq("episode_id", episodeId)
          .eq("user_id", user.id)
          .maybeSingle();
        setUserReaction(mine?.reaction_key ?? null);
      }

      setLoading(false);
    };

    fetchData();
  }, [episodeId, user]);

  useEffect(() => {
    if (!showLoginPrompt) return;
    const handleClick = (e: MouseEvent) => {
      if (promptRef.current && !promptRef.current.contains(e.target as Node)) {
        setShowLoginPrompt(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLoginPrompt]);

  const handleReaction = async (key: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    const supabase = createClient();
    const isToggleOff = userReaction === key;

    const prevCounts = { ...counts };
    const prevReaction = userReaction;

    if (isToggleOff) {
      setCounts((c) => ({ ...c, [key]: Math.max((c[key] ?? 1) - 1, 0) }));
      setUserReaction(null);
    } else {
      const next: Counts = { ...counts };
      if (prevReaction) {
        next[prevReaction] = Math.max((next[prevReaction] ?? 1) - 1, 0);
      }
      next[key] = (next[key] ?? 0) + 1;
      setCounts(next);
      setUserReaction(key);
    }

    try {
      if (isToggleOff) {
        await supabase
          .from("episode_reactions")
          .delete()
          .eq("episode_id", episodeId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("episode_reactions")
          .upsert(
            { episode_id: episodeId, user_id: user.id, reaction_key: key },
            { onConflict: "episode_id,user_id" }
          );
      }
    } catch {
      setCounts(prevCounts);
      setUserReaction(prevReaction);
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const score =
    total === 0
      ? 0
      : REACTIONS.reduce((acc, r) => acc + r.weight * (counts[r.key] ?? 0), 0) / total;

  const barTotal = Math.max(total, 1);

  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 animate-pulse h-40" />
    );
  }

  return (
    <div className="relative">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            O que você achou deste episódio?
          </p>
          <span className="text-xs text-[var(--text-muted)]">{total} avaliações</span>
        </div>

        {/* Reaction buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {REACTIONS.map((r) => {
            const isActive = userReaction === r.key;
            return (
              <button
                key={r.key}
                onClick={() => handleReaction(r.key)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border transition-all ${
                  isActive
                    ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                    : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
                }`}
              >
                <span className="text-2xl leading-none">{r.emoji}</span>
                <span className="text-[10px] leading-tight text-center">{r.label}</span>
                <span className="text-xs font-bold">{counts[r.key] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Distribution bar */}
        <div className="flex flex-col gap-1">
          <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
            {REACTIONS.map((r) => {
              const count = counts[r.key] ?? 0;
              if (count === 0) return null;
              const widthPct = Math.max((count / barTotal) * 100, 0.5);
              return (
                <div
                  key={r.key}
                  style={{ width: `${widthPct}%`, minWidth: "4px" }}
                  className="bg-[var(--yellow)] opacity-60 rounded-sm"
                />
              );
            })}
            {total === 0 && (
              <div className="w-full bg-[var(--border)] rounded-full" />
            )}
          </div>
          <div className="flex gap-px">
            {REACTIONS.map((r) => {
              const count = counts[r.key] ?? 0;
              if (count === 0) return null;
              const widthPct = Math.max((count / barTotal) * 100, 0.5);
              return (
                <div
                  key={r.key}
                  style={{ width: `${widthPct}%`, minWidth: "4px" }}
                  className="flex justify-center"
                >
                  <span className="text-[10px] leading-none">{r.emoji}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score row */}
        {total === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center">
            Seja o primeiro a avaliar
          </p>
        ) : (
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-[var(--yellow)] leading-none">
              {score.toFixed(1)}<span className="text-sm font-normal text-[var(--text-muted)]">/10</span>
              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">nota Radiola</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] text-right">
              Baseado em {total} avaliações da comunidade
            </p>
          </div>
        )}
      </div>

      {/* Login prompt */}
      {showLoginPrompt && (
        <div ref={promptRef} className="absolute left-0 right-0 top-full mt-2 z-50">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-4 shadow-lg">
            <p className="text-sm text-[var(--text-primary)] mb-3">
              Entre para avaliar este episódio.
            </p>
            <div className="flex gap-2">
              <Link
                href="/login"
                className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
                onClick={() => setShowLoginPrompt(false)}
              >
                Logar
              </Link>
              <Link
                href="/criar-conta"
                className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
                onClick={() => setShowLoginPrompt(false)}
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

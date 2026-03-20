"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";
import { episodeId } from "@/services/comments";
import Link from "next/link";

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  initialCount?: number;
}

export const EpisodeLikeButton = ({ seriesId, seasonNumber, episodeNumber, initialCount = 0 }: Props) => {
  const { user } = useAuth();
  const epId = episodeId(seriesId, seasonNumber, episodeNumber);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("episode_likes")
      .select("id", { count: "exact" })
      .eq("episode_id", epId)
      .then(({ count: c }) => setCount(c ?? initialCount));

    if (user) {
      supabase
        .from("episode_likes")
        .select("id")
        .eq("episode_id", epId)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setLiked(!!data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [epId, user, initialCount]);

  const toggle = async () => {
    if (!user) { setShowPrompt((v) => !v); return; }
    const supabase = createClient();
    if (liked) {
      setLiked(false);
      setCount((v) => v - 1);
      await supabase.from("episode_likes").delete().eq("episode_id", epId).eq("user_id", user.id);
    } else {
      setLiked(true);
      setCount((v) => v + 1);
      await supabase.from("episode_likes").insert({ episode_id: epId, user_id: user.id });
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex flex-col items-center gap-1 transition-all ${liked ? "text-red-500" : "text-[var(--text-muted)] hover:text-red-400"}`}
        aria-label="Curtir episódio"
      >
        {liked ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
        {count > 0 && <span className="text-[10px] font-semibold">{count}</span>}
      </button>

      {showPrompt && !user && (
        <div className="absolute bottom-full right-0 mb-2 w-52 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 shadow-lg z-10">
          <p className="text-xs text-[var(--text-secondary)] mb-2">Entre para curtir este episódio.</p>
          <div className="flex gap-2">
            <Link href="/login" onClick={() => setShowPrompt(false)} className="flex-1 text-center text-xs py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors">
              Entrar
            </Link>
            <Link href="/criar-conta" onClick={() => setShowPrompt(false)} className="flex-1 text-center text-xs py-1.5 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

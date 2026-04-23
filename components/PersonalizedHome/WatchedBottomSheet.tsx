"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase-browser";
import { FaXmark, FaCheck } from "react-icons/fa6";

const EMOJIS = ["🤯", "😭", "😂", "🔥", "😴"];

interface Props {
  open: boolean;
  episodeId: string;
  seriesName: string;
  episodeLabel: string;
  onClose: () => void;
}

function Star({ active, onClick, onEnter, onLeave }: {
  active: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <button onClick={onClick} onMouseEnter={onEnter} onMouseLeave={onLeave} className="p-1 transition-transform active:scale-95 hover:scale-110">
      <svg width="28" height="28" viewBox="0 0 24 24"
        fill={active ? "#A0C830" : "none"}
        stroke={active ? "#A0C830" : "rgba(255,255,255,0.15)"}
        strokeWidth="1.5" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

export function WatchedBottomSheet({ open, episodeId, seriesName, episodeLabel, onClose }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reaction, setReaction] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) { setRating(0); setHovered(0); setReaction(null); setComment(""); }
  }, [open]);

  const saveRating = async (value: number) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("episode_reactions").upsert(
      { user_id: user.id, episode_id: episodeId, reaction_key: String(value) },
      { onConflict: "user_id,episode_id" }
    );
  };

  const handleStar = async (n: number) => {
    setRating(n);
    await saveRating(n);
  };

  const sendComment = async () => {
    if (!user || !comment.trim() || sending) return;
    setSending(true);
    const supabase = createClient();
    await supabase.from("comments").insert({
      user_id: user.id,
      episode_id: episodeId,
      content: comment.trim(),
      spoiler: false,
    });
    setSending(false);
    onClose(); // fecha ao enviar
  };

  if (!open) return null;

  const activeStars = hovered || rating;

  const content = (
    <div className="flex flex-col gap-5 px-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(160,200,48,0.15)" }}>
            <FaCheck size={14} style={{ color: "#A0C830" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{seriesName} · {episodeLabel}</p>
            <p className="text-xs text-white/40 mt-0.5">marcado como assistido</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors p-1">
          <FaXmark size={18} />
        </button>
      </div>

      {/* Avaliação */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">sua nota</p>
        <div className="flex gap-0" onMouseLeave={() => setHovered(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              active={n <= activeStars}
              onClick={() => handleStar(n)}
              onEnter={() => setHovered(n)}
              onLeave={() => setHovered(0)}
            />
          ))}
        </div>
      </div>

      {/* Reação */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">reação</p>
        <div className="flex gap-2 flex-wrap">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setReaction(reaction === emoji ? null : emoji)}
              className="px-3 py-1.5 rounded-full text-lg transition-all"
              style={{
                background: reaction === emoji ? "rgba(160,200,48,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${reaction === emoji ? "#A0C830" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Comentário */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">comentário</p>
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendComment()}
            placeholder="o que achou desse episódio?"
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
          />
          <button
            onClick={sendComment}
            disabled={!comment.trim() || sending}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-25"
            style={{ background: comment.trim() ? "#A0C830" : "rgba(255,255,255,0.1)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={comment.trim() ? "#0a0a0a" : "white"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay — clique fora fecha */}
      <div className="fixed inset-0 z-50 bg-black/65" onClick={onClose} />

      {/* Mobile: bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t animate-slide-up"
        style={{ background: "#0d1a09", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 rounded-full bg-white/15" />
        </div>
        {content}
      </div>

      {/* Desktop: painel lateral direito */}
      <div className="hidden lg:block fixed top-0 right-0 bottom-0 z-50 w-[400px] animate-slide-in-right border-l shadow-2xl"
        style={{ background: "#0d1a09", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-5 h-full overflow-y-auto">
          {content}
        </div>
      </div>
    </>
  );
}

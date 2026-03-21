"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { commentsService, Comment, episodeId } from "@/services/comments";
import { FaTrash } from "react-icons/fa6";

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  placeholder?: string;
  refreshKey?: number;
}

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function UserAvatar({ avatarUrl, username }: { avatarUrl: string | null; username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = ["#4f46e5", "#16a34a", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];
  const color = colors[username.charCodeAt(0) % colors.length];

  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-xs font-bold text-white"
      style={{ backgroundColor: avatarUrl ? undefined : color }}
    >
      {avatarUrl
        ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="32px" />
        : initials}
    </div>
  );
}

type Tab = "recentes" | "relevantes";

interface LikeState {
  [commentId: string]: { liked: boolean; count: number };
}

export const EpisodeComments = ({ seriesId, seasonNumber, episodeNumber, refreshKey }: Props) => {
  const { user } = useAuth();
  const epId = episodeId(seriesId, seasonNumber, episodeNumber);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recentes");
  const [likeState, setLikeState] = useState<LikeState>({});

  useEffect(() => {
    setLoading(true);
    commentsService.getComments(epId).then((data) => {
      setComments(data);
      const initial: LikeState = {};
      for (const c of data) {
        initial[c.id] = { liked: false, count: c.likes ?? 0 };
      }
      setLikeState(initial);
      setLoading(false);
    });
  }, [epId, refreshKey]);

  const sortedComments = [...comments].sort((a, b) => {
    if (tab === "recentes") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    const likesA = likeState[a.id]?.count ?? a.likes ?? 0;
    const likesB = likeState[b.id]?.count ?? b.likes ?? 0;
    return likesB - likesA;
  });

  const handleDelete = async (id: string) => {
    await commentsService.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    setLikeState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleLike = (id: string) => {
    setLikeState((prev) => {
      const current = prev[id] ?? { liked: false, count: 0 };
      return {
        ...prev,
        [id]: {
          liked: !current.liked,
          count: current.liked ? current.count - 1 : current.count + 1,
        },
      };
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {loading ? "..." : comments.length} comentário{comments.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab("recentes")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              tab === "recentes"
                ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
            }`}
          >
            Recentes
          </button>
          <button
            onClick={() => setTab("relevantes")}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              tab === "relevantes"
                ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
            }`}
          >
            Relevantes
          </button>
        </div>
      </div>

      {/* Comment list */}
      {!loading && comments.length > 0 && (
        <div className="flex flex-col">
          {sortedComments.map((c, i) => {
            const likes = likeState[c.id] ?? { liked: false, count: c.likes ?? 0 };
            return (
              <div
                key={c.id}
                className={`py-4 ${i < sortedComments.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar avatarUrl={c.avatar_url} username={c.username} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{c.username}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">{relativeTime(c.created_at)}</span>
                        {user?.id === c.user_id && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                            aria-label="Apagar comentário"
                          >
                            <FaTrash size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">{c.text}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(c.id)}
                        className={`text-xs transition-colors flex items-center gap-1 ${
                          likes.liked
                            ? "text-red-400"
                            : "text-[var(--text-muted)] hover:text-red-400"
                        }`}
                      >
                        ♥ {likes.count}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          Seja o primeiro a comentar este episódio.
        </p>
      )}
    </div>
  );
};

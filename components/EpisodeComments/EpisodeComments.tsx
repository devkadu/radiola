"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { commentsService, Comment, episodeId } from "@/services/comments";
import { FaTrash } from "react-icons/fa6";

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  episodeUrl?: string;
  refreshKey?: number;
}

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function UserAvatar({ avatarUrl, username, size = 32 }: { avatarUrl: string | null; username: string; size?: number }) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = ["#4f46e5", "#16a34a", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-xs font-bold text-white"
      style={{ width: size, height: size, backgroundColor: avatarUrl ? undefined : color }}
    >
      {avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        : initials}
    </div>
  );
}

interface ReplyBoxProps {
  epId: string;
  parentId: string;
  parentUsername: string;
  episodeTitle?: string;
  episodeUrl?: string;
  onSubmit: (comment: Comment) => void;
  onCancel: () => void;
}

function ReplyBox({ epId, parentId, parentUsername, episodeTitle, episodeUrl, onSubmit, onCancel }: ReplyBoxProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const comment = await commentsService.addComment(epId, user.id, username, avatarUrl, text.trim(), parentId);
      onSubmit(comment);
      setText("");
      // Dispara notificação de resposta em background (sem bloquear a UI)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reply",
          parentCommentId: parentId,
          replierUsername: username,
          episodeTitle,
          episodeUrl: episodeUrl ? `${window.location.origin}${episodeUrl}` : window.location.href,
        }),
      }).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-xs text-[var(--text-muted)]">Respondendo <span className="text-[var(--yellow)]">@{parentUsername}</span></p>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escreva sua resposta..."
        rows={3}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--yellow)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3 py-2 outline-none resize-none transition-colors"
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          className="text-xs px-3 py-1.5 rounded-full bg-[var(--yellow)] text-black font-bold disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
        >
          {submitting ? "Enviando..." : "Responder"}
        </button>
      </div>
    </div>
  );
}

type Tab = "recentes" | "relevantes";
interface LikeState { [id: string]: { liked: boolean; count: number } }

export const EpisodeComments = ({ seriesId, seasonNumber, episodeNumber, episodeTitle, episodeUrl, refreshKey }: Props) => {
  const { user } = useAuth();
  const epId = episodeId(seriesId, seasonNumber, episodeNumber);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recentes");
  const [likeState, setLikeState] = useState<LikeState>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    commentsService.getComments(epId).then((data) => {
      setComments(data);
      const initial: LikeState = {};
      for (const c of data) initial[c.id] = { liked: false, count: c.likes ?? 0 };
      setLikeState(initial);
      setLoading(false);
    });
  }, [epId, refreshKey]);

  // Organiza em threads: comentários raiz + replies agrupados
  const roots = comments.filter((c) => !c.parent_id);
  const repliesByParent: Record<string, Comment[]> = {};
  for (const c of comments) {
    if (c.parent_id) {
      if (!repliesByParent[c.parent_id]) repliesByParent[c.parent_id] = [];
      repliesByParent[c.parent_id].push(c);
    }
  }

  const sortedRoots = [...roots].sort((a, b) => {
    if (tab === "recentes") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const la = likeState[a.id]?.count ?? a.likes ?? 0;
    const lb = likeState[b.id]?.count ?? b.likes ?? 0;
    return lb - la;
  });

  const handleDelete = async (id: string) => {
    await commentsService.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    setLikeState((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleLike = (id: string) => {
    setLikeState((prev) => {
      const cur = prev[id] ?? { liked: false, count: 0 };
      return { ...prev, [id]: { liked: !cur.liked, count: cur.liked ? cur.count - 1 : cur.count + 1 } };
    });
  };

  const handleReplySubmit = (comment: Comment) => {
    setComments((prev) => [...prev, comment]);
    setLikeState((prev) => ({ ...prev, [comment.id]: { liked: false, count: 0 } }));
    setReplyingTo(null);
  };

  const renderComment = (c: Comment, isReply = false) => {
    const likes = likeState[c.id] ?? { liked: false, count: c.likes ?? 0 };
    const replies = repliesByParent[c.id] ?? [];

    return (
      <div key={c.id}>
        <div className={`flex items-start gap-3 ${isReply ? "pl-10" : ""}`}>
          <Link href={`/u/${c.username}`} className="shrink-0 hover:opacity-80 transition-opacity">
            <UserAvatar
              avatarUrl={c.user_id === user?.id ? (user.user_metadata?.avatar_url ?? c.avatar_url) : c.avatar_url}
              username={c.username}
              size={isReply ? 24 : 32}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className={`font-bold text-[var(--text-primary)] ${isReply ? "text-xs" : "text-sm"}`}>{c.username}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{relativeTime(c.created_at)}</span>
                {user?.id === c.user_id && (
                  <button onClick={() => handleDelete(c.id)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors">
                    <FaTrash size={10} />
                  </button>
                )}
              </div>
            </div>
            <p className={`text-[var(--text-secondary)] leading-relaxed mb-2 ${isReply ? "text-xs" : "text-sm"}`}>{c.text}</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleLike(c.id)}
                className={`text-xs transition-colors flex items-center gap-1 ${likes.liked ? "text-red-400" : "text-[var(--text-muted)] hover:text-red-400"}`}
              >
                ♥ {likes.count}
              </button>
              {!isReply && user && (
                <button
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--yellow)] transition-colors"
                >
                  ↩ Responder
                </button>
              )}
            </div>

            {/* Reply box */}
            {replyingTo === c.id && (
              <ReplyBox
                epId={epId}
                parentId={c.id}
                parentUsername={c.username}
                episodeTitle={episodeTitle}
                episodeUrl={episodeUrl}
                onSubmit={handleReplySubmit}
                onCancel={() => setReplyingTo(null)}
              />
            )}
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-[var(--border)] ml-4 pl-2">
            {replies.map((r) => renderComment(r, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {loading ? "..." : comments.filter(c => !c.parent_id).length} comentário{roots.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1.5">
          {(["recentes", "relevantes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize ${
                tab === t
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {!loading && sortedRoots.length > 0 && (
        <div className="flex flex-col gap-5">
          {sortedRoots.map((c, i) => (
            <div key={c.id} className={i < sortedRoots.length - 1 ? "pb-5 border-b border-[var(--border)]" : ""}>
              {renderComment(c)}
            </div>
          ))}
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

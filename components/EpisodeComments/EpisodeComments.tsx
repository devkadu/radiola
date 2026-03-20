"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { commentsService, Comment, episodeId } from "@/services/comments";
import { FaTrash } from "react-icons/fa6";

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  placeholder?: string;
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
    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: avatarUrl ? undefined : color }}>
      {avatarUrl
        ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="32px" />
        : initials}
    </div>
  );
}

export const EpisodeComments = ({ seriesId, seasonNumber, episodeNumber, placeholder }: Props) => {
  const { user } = useAuth();
  const epId = episodeId(seriesId, seasonNumber, episodeNumber);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  useEffect(() => {
    commentsService.getComments(epId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [epId]);

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await commentsService.addComment(epId, user.id, username, avatarUrl, text.trim());
      setComments((prev) => [newComment, ...prev]);
      setText("");
    } catch (e: any) {
      setError(e?.message ?? "Erro ao publicar comentário. Verifique se a tabela foi criada no Supabase.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await commentsService.deleteComment(id);
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Lista de comentários */}
      {!loading && comments.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-[var(--text-muted)] mb-3 uppercase">
            {comments.length} comentário{comments.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar avatarUrl={c.avatar_url} username={c.username} />
                    <span className="text-sm font-medium text-[var(--text-primary)]">{c.username}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">{relativeTime(c.created_at)}</span>
                    {user?.id === c.user_id && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      >
                        <FaTrash size={11} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          Seja o primeiro a comentar este episódio.
        </p>
      )}

      {/* Caixa de comentário */}
      {user ? (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
          <p className="text-xs font-semibold tracking-widest text-[var(--text-muted)] px-4 pt-4 pb-2 uppercase">
            Deixe sua opinião sobre o episódio
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder ?? "Sem medo — aqui só quem chegou até aqui..."}
            rows={4}
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 pb-3 outline-none resize-none"
          />
          {error && (
            <p className="text-xs text-red-400 px-4 pb-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 px-4 pb-4">
            <button
              onClick={() => setText("")}
              className="px-5 py-2 rounded-full text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-5 py-2 rounded-full text-sm font-bold bg-[var(--yellow)] text-black disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
            >
              {submitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl p-5 text-center flex flex-col gap-3 bg-[var(--bg-surface)]">
          <p className="text-sm text-[var(--text-secondary)]">Entre para comentar este episódio.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="text-sm px-5 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Entrar
            </Link>
            <Link href="/criar-conta" className="text-sm px-5 py-2 rounded-full bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

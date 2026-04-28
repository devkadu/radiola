"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { commentsService } from "@/services/comments";
import { EpisodeComments } from "@/components/EpisodeComments/EpisodeComments";
import { FaShareNodes, FaCheck } from "react-icons/fa6";
import Link from "next/link";

interface Props {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
}

export function ArticleFooter({ articleId, articleTitle, articleUrl }: Props) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const commentId = `article-${articleId}`;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const handleShare = async () => {
    const url = `${window.location.origin}${articleUrl}`;
    if (navigator.share) {
      await navigator.share({ title: articleTitle, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await commentsService.addComment(commentId, user.id, username, avatarUrl, text.trim());
      setText("");
      setRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 flex flex-col gap-6">
      {/* Compartilhar */}
      <div className="flex items-center gap-3 pt-6 border-t border-[var(--border)]">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--yellow)]/40 transition-colors"
        >
          {copied ? <FaCheck size={13} className="text-emerald-400" /> : <FaShareNodes size={13} />}
          {copied ? "Copiado!" : "Compartilhar"}
        </button>
      </div>

      {/* Caixa de comentário */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Comentários</p>

        {user ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="O que você achou?"
              rows={3}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--yellow)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3 py-2 outline-none resize-none transition-colors"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="text-sm px-4 py-1.5 rounded-full bg-[var(--yellow)] text-black font-bold disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
              >
                {submitting ? "Enviando…" : "Comentar"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            <Link href="/login" className="text-[var(--yellow)] hover:underline">Entre</Link> para comentar.
          </p>
        )}

        <EpisodeComments id={commentId} refreshKey={refreshKey} emptyMessage="Seja o primeiro a comentar este artigo." />
      </div>
    </div>
  );
}

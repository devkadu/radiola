"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { commentsService } from "@/services/comments";
import { EpisodeComments } from "@/components/EpisodeComments/EpisodeComments";
import { FaShareNodes, FaCheck, FaHeart } from "react-icons/fa6";

interface Props {
  plataforma: string;
  platformName: string;
  platformColor: string;
  pageUrl: string;
  pageTitle: string;
}

export function MelhoresFooter({ plataforma, platformName, platformColor, pageUrl, pageTitle }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const commentId = `melhores-${plataforma}`;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const handleShare = async () => {
    const url = `${window.location.origin}${pageUrl}`;
    if (navigator.share) {
      await navigator.share({ title: pageTitle, url }).catch(() => {});
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
    <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col gap-6">
      {/* Título + like */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Você concorda com essa lista?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {user
              ? `Escreva abaixo o seu top 10 do ${platformName} — ou discorde à vontade.`
              : `Fãs de séries debatem essa lista no Segunda Temporada. Crie uma conta grátis e deixe o seu top 10 do ${platformName}.`}
          </p>
        </div>
        <button
          onClick={() => setLiked((v) => !v)}
          className={`flex flex-col items-center gap-0.5 shrink-0 transition-colors ${liked ? "text-red-400" : "text-[var(--text-muted)] hover:text-red-400"}`}
        >
          <FaHeart size={20} />
          <span className="text-[10px] font-bold">{liked ? "Curtido" : "Curtir"}</span>
        </button>
      </div>

      {/* Botões CTA */}
      <div className="flex gap-3">
        {user ? (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full bg-[var(--yellow)] text-black font-bold hover:bg-[var(--yellow-dim)] transition-colors"
          >
            {copied ? <FaCheck size={13} /> : <FaShareNodes size={13} />}
            {copied ? "Copiado!" : "Compartilhar lista"}
          </button>
        ) : (
          <Link
            href="/criar-conta"
            className="text-sm px-5 py-2.5 rounded-full bg-[var(--yellow)] text-black font-bold hover:bg-[var(--yellow-dim)] transition-colors"
          >
            Criar conta grátis
          </Link>
        )}
        <Link
          href="/series"
          className="text-sm px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--yellow)]/40 transition-colors"
        >
          Ver catálogo
        </Link>
      </div>

      {/* Comentários */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Comentários</p>

        {user ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Seu top 10 do ${platformName}, o que ficou de fora, ou por que discorda...`}
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

        <EpisodeComments
          id={commentId}
          refreshKey={refreshKey}
          emptyMessage={`Seja o primeiro a comentar sobre as melhores séries do ${platformName}.`}
        />
      </div>
    </div>
  );
}

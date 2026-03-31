"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { commentsService, episodeId } from "@/services/comments";
import { LoginSheet } from "@/components/LoginSheet/LoginSheet";

interface InlineCommentInputProps {
  episodeId: string;
  placeholder?: string;
  onCommentAdded?: () => void;
}

export function InlineCommentInput({ episodeId: epId, placeholder, onCommentAdded }: InlineCommentInputProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const handleClick = () => {
    if (!user) { setShowLoginPrompt(true); return; }
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCancel = () => {
    setExpanded(false);
    setText("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await commentsService.addComment(epId, user.id, username, avatarUrl, text.trim());
      onCommentAdded?.();
      handleCancel();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao publicar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <LoginSheet
      show={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Entre para comentar este episódio."
    />
    <div className="relative">
      {!expanded ? (
        <div
          onClick={handleClick}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--yellow)] transition-colors cursor-text"
        >
          {user ? (
            <div
              className="w-6 h-6 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: avatarUrl ? undefined : "#4f46e5" }}
            >
              {avatarUrl
                ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="24px" />
                : username.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-muted)] shrink-0">
              <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M2.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          )}
          <span className="text-sm text-[var(--text-muted)] select-none">
            {placeholder ?? "Adicionar um comentário..."}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder ?? "Adicionar um comentário..."}
            rows={3}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--yellow)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 py-3 outline-none resize-none transition-colors"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 rounded-full text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="px-4 py-1.5 rounded-full text-sm font-bold bg-[var(--yellow)] text-black disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
            >
              {submitting ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      )}

    </div>
    </>
  );
}

interface ShareEpisodeButtonProps {
  seriesName: string;
  episodeName: string;
}

export function ShareEpisodeButton({ seriesName, episodeName }: ShareEpisodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Estou assistindo "${episodeName}" de ${seriesName} na Segunda Temporada 📺`;
    if (navigator.share) {
      await navigator.share({ title: "Segunda Temporada", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)] transition-colors"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}

export function CommentCTA() {
  const open = () => {
    window.dispatchEvent(new CustomEvent("open-comment-drawer"));
  };

  return (
    <button
      onClick={open}
      className="bg-[var(--yellow)] text-black font-bold px-5 py-3 rounded-full shadow-lg hover:bg-[var(--yellow-dim)] transition-colors text-sm"
    >
      + Comentar episódio
    </button>
  );
}

export function CollapsibleSinopse({ overview }: { overview: string }) {
  return (
    <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
      {overview}
    </p>
  );
}

interface DrawerProps {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  placeholder?: string;
  onCommentAdded?: () => void;
}

export function CommentDrawer({
  seriesId,
  seasonNumber,
  episodeNumber,
  placeholder,
  onCommentAdded,
}: DrawerProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const epId = episodeId(seriesId, seasonNumber, episodeNumber);
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setTimeout(() => setVisible(true), 10);
    };
    window.addEventListener("open-comment-drawer", handler);
    return () => window.removeEventListener("open-comment-drawer", handler);
  }, []);

  useEffect(() => {
    if (visible && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [visible]);

  const close = () => {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      setText("");
      setError(null);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await commentsService.addComment(epId, user.id, username, avatarUrl, text.trim());
      onCommentAdded?.();
      close();
    } catch (e: any) {
      setError(e?.message ?? "Erro ao publicar comentário.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />

      {/* Drawer — slides up on mobile, from right on desktop */}
      <div
        className={`fixed z-50 bg-[var(--bg-surface)] transition-transform duration-300 ease-out
          /* mobile: bottom sheet */
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] flex flex-col
          /* desktop: side panel */
          lg:top-0 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[420px] lg:rounded-l-2xl lg:rounded-tr-none lg:max-h-full
          ${visible
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-y-0 lg:translate-x-full"
          }`}
      >
        {/* Handle bar — mobile only */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <p className="text-sm font-bold text-[var(--text-primary)]">Comentar episódio</p>
          <button
            onClick={close}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {user ? (
            <>
              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: avatarUrl ? undefined : "#4f46e5" }}
                >
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="32px" />
                    : username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{username}</span>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder ?? "Sem medo — aqui só quem chegou até aqui..."}
                rows={5}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 py-3 outline-none resize-none focus:border-[var(--yellow)] transition-colors"
              />

              {error && <p className="text-xs text-red-400">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={close}
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
            </>
          ) : (
            <div className="flex flex-col gap-4 items-center py-6 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Entre para comentar este episódio.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/login"
                  onClick={close}
                  className="text-sm px-5 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/criar-conta"
                  onClick={close}
                  className="text-sm px-5 py-2 rounded-full bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

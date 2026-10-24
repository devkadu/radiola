"use client";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { LoginSheet } from "@/features/auth/components/login-sheet/login-sheet";
import { commentsService } from "@/features/discussions/api/comments.api";
import Image from "next/image";
import { useRef,useState } from "react";

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao publicar comentário.");
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

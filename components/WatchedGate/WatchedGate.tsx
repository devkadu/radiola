"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { watchedEpisodesService } from "@/services/watchedEpisodes";

interface Props {
  episodeId: string;
  episodeTitle: string;
  children: React.ReactNode;
}

export function WatchedGate({ episodeId, episodeTitle, children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "gate" | "open">("loading");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Aguarda auth terminar de carregar
    if (authLoading) return;

    const check = async () => {
      if (!user) {
        setStatus("gate");
        setTimeout(() => setModalVisible(true), 60);
        return;
      }
      try {
        const watched = await watchedEpisodesService.isWatched(user.id, episodeId);
        if (watched) {
          setStatus("open");
        } else {
          setStatus("gate");
          setTimeout(() => setModalVisible(true), 60);
        }
      } catch {
        // Em caso de erro, libera o conteúdo para não travar o usuário
        setStatus("open");
      }
    };

    check();
  }, [user, authLoading, episodeId]);

  const handleConfirm = useCallback(async () => {
    if (user) {
      await watchedEpisodesService.markWatched(user.id, episodeId);
    }
    setModalVisible(false);
    setTimeout(() => setStatus("open"), 280);
  }, [user, episodeId]);

  const handleDecline = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleReopen = useCallback(() => {
    setModalVisible(true);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3 mt-2">
        <div className="h-12 rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
        <div className="h-32 rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
      </div>
    );
  }

  if (status === "open") return <>{children}</>;

  /* ── GATE ── */
  const modalContent = (
    <div className="flex flex-col h-full">
      {/* Handle (mobile only) */}
      <div className="md:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 justify-center items-center text-center px-8 py-10 gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[var(--yellow-muted)] flex items-center justify-center text-3xl">
          🎬
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)] leading-snug">
            Você já assistiu este episódio?
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Os comentários aqui podem conter discussões sobre o que acontece em
          </p>
          <p className="text-sm font-semibold text-[var(--yellow)]">{episodeTitle}</p>
        </div>

        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl bg-[var(--yellow)] text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Sim, já assisti ✓
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-elevated)] active:scale-[0.98] transition-all"
          >
            Ainda não assisti
          </button>
        </div>

        {user ? (
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Isso será salvo no seu perfil e não perguntaremos novamente.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
            Sem conta, sua escolha não é salva.{" "}
            <a href="/login" className="text-[var(--yellow)] underline underline-offset-2">
              Entrar
            </a>{" "}
            para guardar seu progresso automaticamente.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — painel lateral direito */}
      <div
        className={`hidden md:flex fixed right-0 top-0 h-full w-[400px] bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 flex-col shadow-2xl transition-transform duration-300 ease-out ${
          modalVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {modalContent}
      </div>

      {/* Mobile — bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] z-50 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          modalVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {modalContent}
      </div>

      {/* Placeholder quando modal fechado (usuário recusou) */}
      {!modalVisible && (
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl">
            🔒
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Comentários bloqueados
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Confirme que assistiu para ver as discussões
            </p>
          </div>
          <button
            onClick={handleReopen}
            className="px-5 py-2.5 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)] text-sm font-semibold hover:bg-[var(--yellow)] hover:text-black transition-colors"
          >
            Já assisti este episódio
          </button>
        </div>
      )}
    </>
  );
}

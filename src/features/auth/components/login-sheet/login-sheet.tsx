"use client";
import { ROUTES } from "@/shared/constants/routes";
import Link from "next/link";
import { useEffect,useRef } from "react";
interface Props {
  show: boolean;
  onClose: () => void;
  message?: string;
}
export function LoginSheet({ show, onClose, message = "Entre para continuar." }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (show && dialog && !dialog.open) dialog.showModal();
    else if (!show && dialog?.open) dialog.close();
  }, [show]);
  const content = (
    <div className="flex flex-col flex-1 justify-center items-center text-center px-8 py-10 gap-5">
      <div className="w-14 h-14 rounded-2xl bg-[var(--yellow-muted)] flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--yellow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)]">
          Conta necessária
        </p>
        <p className="text-lg font-bold text-[var(--text-primary)] leading-snug">{message}</p>
      </div>

      <div className="flex flex-col gap-3 w-full mt-2">
        <Link
          href={ROUTES.signUp}
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-[var(--yellow)] text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all text-center"
        >
          Criar conta grátis
        </Link>
        <Link
          href={ROUTES.login}
          onClick={onClose}
          className="w-full py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-elevated)] active:scale-[0.98] transition-all text-center"
        >
          Já tenho conta — Entrar
        </Link>
      </div>
    </div>
  );

  return (
    <dialog
      ref={ref}
      aria-label="Entrar na Segunda Temporada"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed m-0 top-auto bottom-0 w-full max-w-none max-h-[90dvh] rounded-t-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] backdrop:bg-black/60 md:top-0 md:bottom-auto md:left-auto md:right-0 md:h-dvh md:max-h-none md:w-[400px] md:rounded-none"
    >
      <div className="flex justify-between px-5 py-4 border-b border-[var(--border)]">
        <span>Entrar na Segunda Temporada</span>
        <button aria-label="Fechar" onClick={onClose}>
          ×
        </button>
      </div>
      {content}
    </dialog>
  );
}

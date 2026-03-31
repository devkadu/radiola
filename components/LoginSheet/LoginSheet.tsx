"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginSheet({ show, onClose, message = "Entre para continuar." }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!mounted) return null;

  const content = (
    <div className="flex flex-col flex-1 justify-center items-center text-center px-8 py-10 gap-5">
      <div className="w-14 h-14 rounded-2xl bg-[var(--yellow-muted)] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)]">Conta necessária</p>
        <p className="text-lg font-bold text-[var(--text-primary)] leading-snug">{message}</p>
      </div>

      <div className="flex flex-col gap-3 w-full mt-2">
        <Link
          href="/criar-conta"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-[var(--yellow)] text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all text-center"
        >
          Criar conta grátis
        </Link>
        <Link
          href="/login"
          onClick={onClose}
          className="w-full py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-elevated)] active:scale-[0.98] transition-all text-center"
        >
          Já tenho conta — Entrar
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Desktop — painel lateral direito */}
      <div
        className={`hidden md:flex fixed right-0 top-0 h-full w-[400px] bg-[var(--bg-surface)] border-l border-[var(--border)] z-50 flex-col shadow-2xl transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Handle top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <p className="text-sm font-bold text-[var(--text-primary)]">Entrar na Segunda Temporada</p>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        {content}
      </div>

      {/* Mobile — bottom sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] z-50 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>
        {content}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa6";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "Poder marcar episódios como favoritos",
  "Filtrar comentários por temporada",
  "Notificação quando um novo episódio estrear",
  "Modo claro",
];

export default function SugestoesPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const remaining = 1000 - message.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10 || status === "sending") return;

    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <main className="px-4 py-6 lg:py-10 max-w-lg pb-28 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--yellow)] flex items-center justify-center text-2xl">
          ✓
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Sugestão enviada!</h1>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Obrigado pela contribuição. Toda ideia é levada a sério por aqui.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-2 text-sm text-[var(--yellow)] hover:underline"
        >
          ← Voltar
        </button>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 lg:py-10 max-w-lg pb-28">

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FaArrowLeft size={13} />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Sugestões</h1>
      </div>

      <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
        Tem uma ideia para melhorar o site? Conta pra gente. Todas as sugestões chegam diretamente na nossa caixa de entrada.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden focus-within:border-[var(--yellow)] transition-colors">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            placeholder="Descreva sua ideia ou sugestão…"
            rows={6}
            className="w-full bg-transparent px-5 pt-4 pb-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none outline-none"
          />
          <div className="px-5 pb-3 flex justify-end">
            <span className={`text-xs ${remaining < 100 ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>
              {remaining}
            </span>
          </div>
        </div>

        {status === "error" && (
          <p className="text-xs text-red-400">Erro ao enviar. Tente novamente.</p>
        )}

        <button
          type="submit"
          disabled={message.trim().length < 10 || status === "sending"}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--yellow)] text-black font-semibold text-sm hover:bg-[var(--yellow-dim)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaPaperPlane size={13} />
          {status === "sending" ? "Enviando…" : "Enviar sugestão"}
        </button>
      </form>

      {/* Exemplos */}
      <div className="mt-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
          Exemplos de sugestões
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setMessage(ex)}
              className="text-left text-sm px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--yellow)] hover:text-[var(--text-primary)] transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

    </main>
  );
}

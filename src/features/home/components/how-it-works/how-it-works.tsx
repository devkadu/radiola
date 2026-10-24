"use client";
import Link from "next/link";

export function HowItWorks() {
  return (
    <section className="px-4 lg:px-8 pb-5">
      <div
        className="rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
        style={{
          background: "var(--bg-elevated)",
          borderLeft: "3px solid var(--yellow)",
        }}
      >
        <p className="text-xs font-bold" style={{ color: "var(--yellow)" }}>
          🔒 Spoiler Lock · como funciona
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Você marca o episódio que assistiu → a discussão daquele episódio se abre → você comenta e vê outros comentários apenas se assistiu o episódio.
        </p>
        <Link
          href="/criar-conta"
          className="self-start mt-0.5 text-[11px] px-3 py-1 rounded-full bg-[var(--yellow)] text-black font-bold hover:bg-[var(--yellow-dim)] transition-colors"
        >
          Criar conta grátis
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links — Segunda Temporada",
  description: "Todos os links da Segunda Temporada em um só lugar.",
};

const links = [
  {
    emoji: "🔥",
    label: "Discussão da semana",
    sublabel: "Demolidor · Episódio 5",
    href: "/series/demolidor-renascido-202555",
    highlight: true,
    external: false,
  },
  {
    emoji: "🏠",
    label: "Página principal",
    href: "/",
    external: false,
  },
  {
    emoji: "💬",
    label: "Reddit",
    href: "https://reddit.com/r/suareddit",
    external: true,
  },
  {
    emoji: "📱",
    label: "Instagram",
    href: "https://instagram.com/asegundatemporada",
    external: true,
  },
  {
    emoji: "🐦",
    label: "Twitter / X",
    href: "https://x.com/s2temporada",
    external: true,
  },
];

export default function LinksPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-start px-4 py-14 text-white">

      {/* Logo + nome */}
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="w-16 h-16 bg-[var(--yellow)] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
          <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
            <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
            <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
          </svg>
        </div>
        <div className="flex flex-col items-center leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Segunda</span>
          <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Temporada</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
          Debate séries sem spoilers, no seu ritmo.
        </p>
      </div>

      {/* Links */}
      <div className="w-full max-w-sm flex flex-col gap-3">
        {links.map((link) => {
          const inner = (
            <div
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all
                ${link.highlight
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] hover:bg-[var(--yellow)]/20"
                  : "bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--yellow)]"
                }`}
            >
              <span className="text-2xl leading-none shrink-0">{link.emoji}</span>
              <div className="flex flex-col min-w-0">
                <span className={`font-semibold text-sm leading-tight ${link.highlight ? "text-[var(--yellow)]" : "text-[var(--text-primary)]"}`}>
                  {link.label}
                </span>
                {link.sublabel && (
                  <span className="text-xs text-[var(--text-muted)] truncate">{link.sublabel}</span>
                )}
              </div>
              <svg className="ml-auto shrink-0 text-[var(--text-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          );

          return link.external ? (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <Link key={link.href} href={link.href}>
              {inner}
            </Link>
          );
        })}
      </div>

      <p className="mt-12 text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
        segundatemporada.com.br
      </p>
    </main>
  );
}

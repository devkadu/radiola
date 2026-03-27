import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const perks = [
  { emoji: "💬", text: "Comente cada episódio da sua série" },
  { emoji: "🔥", text: "Veja o que está em alta no mundo todo" },
  { emoji: "📺", text: "Acompanhe todas as suas séries em um lugar" },
  { emoji: "👥", text: "Encontre quem assiste o que você assiste" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* Lado esquerdo — branding (só desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[var(--yellow)] px-12 py-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black/15 rounded-[9px] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none">
              <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
              <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-tight text-black" style={{ fontFamily: "var(--font-display)" }}>
            Segunda Temporada
          </span>
        </Link>

        <div className="flex flex-col gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-black/50 mb-3">
              onde a sua série continua
            </p>
            <h2 className="text-4xl font-extrabold text-black leading-tight">
              O mundo das séries<br />te espera.
            </h2>
            <p className="text-base text-black/60 mt-3 leading-relaxed">
              Aqui sua série continua!
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3">
                <span className="text-xl">{p.emoji}</span>
                <span className="text-sm font-medium text-black/70">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-black/40">© {new Date().getFullYear()} Segunda Temporada</p>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex flex-col">
        {/* Logo mobile */}
        <div className="lg:hidden px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[var(--yellow)] rounded-[7px] flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 30 30" fill="none">
                <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
                <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
              </svg>
            </div>
            <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
              Segunda Temporada
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10">
          {children}
        </div>
      </div>

    </div>
  );
}

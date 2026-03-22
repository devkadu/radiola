import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[var(--yellow)] rounded-[7px] flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 30 30" fill="none">
              <path d="M8 7l10 8-10 8V7z" fill="#0F0E0C"/>
              <path d="M18 7l10 8-10 8V7z" fill="rgba(15,14,12,0.4)"/>
            </svg>
          </div>
          <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
            Segunda Temporada
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </div>
    </div>
  );
}

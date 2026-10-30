import Link from "next/link";
import { LegalLinks } from "@/features/privacy/components/legal-links";

const LegalLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen max-w-3xl mx-auto px-5 py-8">
    <header className="pb-6 border-b border-[var(--border)]">
      <Link href="/" className="font-bold text-[var(--yellow)]">← Segunda Temporada</Link>
    </header>
    <main className="py-8 space-y-7 text-sm leading-7 text-[var(--text-secondary)] [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-[var(--text-primary)] [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_a]:underline [&_a]:text-[var(--yellow)] [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
      {children}
    </main>
    <footer className="pt-6 border-t border-[var(--border)]"><LegalLinks /></footer>
  </div>
);

export default LegalLayout;

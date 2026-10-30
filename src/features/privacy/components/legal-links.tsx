import Link from "next/link";

export const LegalLinks = () => (
  <nav aria-label="Informações legais" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
    <Link className="hover:underline" href="/privacidade">Privacidade</Link>
    <Link className="hover:underline" href="/cookies">Cookies</Link>
    <Link className="hover:underline" href="/termos">Termos de uso</Link>
  </nav>
);

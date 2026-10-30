import tmdbLogo from "@/shared/assets/icons/tmdb-logo.svg";
import Image from "next/image";
import { LegalLinks } from "@/features/privacy/components/legal-links";

export const TmdbAttribution = () => (
  <footer className="border-t border-[var(--border)] px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mb-16 lg:mb-0 shrink-0">
    <Image
      src={tmdbLogo}
      alt="The Movie Database"
      width={52}
      height={7}
      className="opacity-50 shrink-0"
    />
    <p className="text-[9px] text-[var(--text-muted)] leading-none">
      Dados fornecidos pelo TMDB. Não endossado pelo TMDB.
    </p>
    <LegalLinks />
  </footer>
);

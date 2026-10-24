import tmdbLogo from "@/shared/assets/icons/tmdb-logo.svg";
import Image from "next/image";

export const TmdbAttribution = () => (
  <footer className="border-t border-[var(--border)] px-4 py-1.5 flex items-center gap-2 mb-16 lg:mb-0 shrink-0">
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
  </footer>
);

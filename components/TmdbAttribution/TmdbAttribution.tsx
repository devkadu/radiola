import Image from "next/image";

export const TmdbAttribution = () => (
  <footer className="border-t border-[var(--border)] px-4 py-5 flex flex-col items-center gap-3 mb-16 lg:mb-0">
    <Image
      src="/tmdb-logo.svg"
      alt="The Movie Database"
      width={80}
      height={11}
      className="opacity-70"
    />
    <p className="text-[10px] text-[var(--text-muted)] text-center max-w-sm leading-relaxed">
      Este site usa o TMDB e as APIs do TMDB, mas não é endossado,
      certificado ou aprovado pelo TMDB.
    </p>
  </footer>
);

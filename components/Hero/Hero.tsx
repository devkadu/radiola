import { tmdbService } from "@/services/tmdb";
import { seriesSlug } from "@/lib/slugs";
import { HeroSearch } from "./HeroSearch";
import Image from "next/image";
import Link from "next/link";

export async function Hero() {
  const data = await tmdbService.getPopularSeries(1).catch(() => ({ results: [] }));
  const series: any[] = (data.results ?? []).slice(0, 8);

  return (
    <section className="px-4 lg:px-0 pt-6 pb-4 lg:grid lg:grid-cols-[1fr_1fr] lg:gap-10 lg:items-center">

      {/* Esquerda */}
      <div className="flex flex-col gap-5 lg:py-8">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--yellow)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--yellow)] shrink-0" />
          Para quem não larga uma boa série
        </p>

        <div className="flex flex-col gap-3">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
            Acabou o episódio.<br />
            A conversa{" "}
            <span className="text-[var(--yellow)]">começa</span> aqui.
          </h1>
          <p className="text-sm lg:text-base text-[var(--text-secondary)] leading-relaxed max-w-sm">
            Teorias, recomendações, universo expandido e novidades — no seu ritmo, no seu nível de spoiler.
          </p>
        </div>

        <HeroSearch />
      </div>

      {/* Direita — grid de séries, só desktop */}
      <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2 h-[380px]">
        {series.map((s) => {
          const slug = seriesSlug(s.name, s.id);
          return (
            <Link
              key={s.id}
              href={`/series/${slug}`}
              className="relative rounded-xl overflow-hidden group bg-[var(--bg-elevated)]"
            >
              {s.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${s.poster_path}`}
                  alt={s.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="160px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />
              <p className="absolute top-2 inset-x-2 text-[9px] font-bold uppercase tracking-widest text-white/50 leading-tight line-clamp-2">
                {s.name}
              </p>
              <p className="absolute bottom-2 inset-x-2 text-[11px] font-bold text-white leading-tight line-clamp-2">
                {s.name}
              </p>
            </Link>
          );
        })}
      </div>

    </section>
  );
}

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

      {/* Direita — faixas diagonais, só desktop */}
      <div className="hidden lg:flex h-[400px] relative">
        {series.slice(0, 5).map((s, i) => {
          const slug = seriesSlug(s.name, s.id);
          const isFirst = i === 0;
          const isLast = i === 4;
          const clip = `polygon(${isFirst ? "0" : "12%"} 0, 100% 0, ${isLast ? "100%" : "88%"} 100%, 0% 100%)`;
          return (
            <Link
              key={s.id}
              href={`/series/${slug}`}
              className="relative flex-1 group bg-[var(--bg-elevated)] overflow-hidden"
              style={{
                clipPath: clip,
                marginRight: isLast ? 0 : "-5%",
                zIndex: 5 - i,
              }}
            >
              {s.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${s.poster_path}`}
                  alt={s.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="220px"
                />
              )}
              {/* gradiente diagonal por card */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(0,0,0,0.55) 0%, transparent 45%, rgba(0,0,0,0.7) 100%)",
                }}
              />
              {/* nome pequeno no topo */}
              <p className="absolute top-3 left-[18%] right-2 text-[9px] font-bold uppercase tracking-widest text-white/50 leading-tight line-clamp-1">
                {s.name}
              </p>
              {/* nome grande embaixo */}
              <p className="absolute bottom-3 left-[18%] right-2 text-[12px] font-bold text-white leading-tight line-clamp-2">
                {s.name}
              </p>
            </Link>
          );
        })}

        {/* fade lateral esquerdo para fundir com o fundo */}
        <div
          className="absolute inset-y-0 left-0 w-8 pointer-events-none z-10"
          style={{ background: "linear-gradient(to right, var(--bg), transparent)" }}
        />
      </div>

    </section>
  );
}

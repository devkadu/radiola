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

      {/* Direita — cards em perspectiva 3D, só desktop */}
      <div
        className="hidden lg:block relative h-[420px]"
        style={{ perspective: "1100px", perspectiveOrigin: "30% 50%" }}
      >
        {series.slice(0, 5).map((s, i) => {
          const slug = seriesSlug(s.name, s.id);
          // cada card: rotação Y crescente, recuo em Z e offset X/Y para fan-out
          const configs = [
            { rotY: -22, rotZ: -2,  x:  10, y:  10, z:   0, w: 155, h: 235, zIdx: 5 },
            { rotY: -10, rotZ: -1,  x: 110, y: -15, z:  30, w: 148, h: 225, zIdx: 4 },
            { rotY:   0, rotZ:  0,  x: 210, y: -25, z:  50, w: 142, h: 215, zIdx: 3 },
            { rotY:  10, rotZ:  1,  x: 310, y: -10, z:  20, w: 135, h: 205, zIdx: 2 },
            { rotY:  20, rotZ:  2,  x: 395, y:  15, z:   0, w: 128, h: 195, zIdx: 1 },
          ];
          const c = configs[i];
          return (
            <Link
              key={s.id}
              href={`/series/${slug}`}
              className="absolute group rounded-xl overflow-hidden bg-[var(--bg-elevated)]"
              style={{
                width: c.w,
                height: c.h,
                left: c.x,
                top: `calc(50% - ${c.h / 2}px + ${c.y}px)`,
                transform: `rotateY(${c.rotY}deg) rotateZ(${c.rotZ}deg) translateZ(${c.z}px)`,
                zIndex: c.zIdx,
                boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              {s.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${s.poster_path}`}
                  alt={s.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="180px"
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(170deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.75) 100%)",
                }}
              />
              <p className="absolute bottom-3 inset-x-3 text-[11px] font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
                {s.name}
              </p>
            </Link>
          );
        })}

        {/* fade nas bordas para fundir com o fundo */}
        <div className="absolute inset-y-0 left-0 w-10 pointer-events-none z-20"
          style={{ background: "linear-gradient(to right, var(--bg), transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-20 pointer-events-none z-20"
          style={{ background: "linear-gradient(to left, var(--bg), transparent)" }} />
      </div>

    </section>
  );
}

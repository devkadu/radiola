import { tmdbService } from "@/services/tmdb";
import { HeroSearch } from "./HeroSearch";
import Image from "next/image";

export async function Hero() {
  const [page1, page2] = await Promise.all([
    tmdbService.getPopularSeries(1).catch(() => ({ results: [] })),
    tmdbService.getPopularSeries(2).catch(() => ({ results: [] })),
  ]);
  const all: any[] = [...(page1.results ?? []), ...(page2.results ?? [])];
  // repete até ter pelo menos 30 para preencher o fundo
  const bg = Array.from({ length: 30 }, (_, i) => all[i % all.length]);

  return (
    <section className="relative overflow-hidden min-h-[360px] lg:min-h-[400px] flex items-center">

      {/* Fundo: grid rotacionado, ancorado à direita */}
      <div className="absolute top-0 right-0 bottom-0 left-[35%] overflow-hidden">
        <div
          className="absolute grid gap-2"
          style={{
            gridTemplateColumns: "repeat(6, 160px)",
            gridAutoRows: "240px",
            transform: "rotate(-14deg)",
            transformOrigin: "center center",
            top: "-40%",
            left: "-20%",
            right: "-20%",
            bottom: "-40%",
          }}
        >
          {bg.map((s, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
              {s?.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w342${s.poster_path}`}
                  alt={s.name ?? ""}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              )}
            </div>
          ))}
        </div>

        {/* overlay escuro geral */}
        <div className="absolute inset-0 bg-black/50" />
        {/* fade esquerdo para fundir com o conteúdo */}
        <div
          className="absolute inset-y-0 left-0 w-40 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--bg), transparent)" }}
        />
        {/* fade direito */}
        <div
          className="absolute inset-y-0 right-0 w-16 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--bg) 20%, transparent)" }}
        />
        {/* fade topo e base */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, var(--bg), transparent)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--bg), transparent)" }}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 px-4 lg:px-0 py-10 w-full lg:max-w-[52%] flex flex-col gap-4">
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

    </section>
  );
}

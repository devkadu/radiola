import Image from "next/image";
import Link from "next/link";
import { tmdbService } from "@/services/tmdb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Em debate",
  description: "O que o mundo está assistindo e debatendo agora.",
};

function makeSlug(name: string, id: number) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`;
}

function formatAirDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export const revalidate = 3600;

export default async function DebatesPage() {
  const [trendingData, upcomingData] = await Promise.all([
    tmdbService.getTrendingNow("day"),
    tmdbService.getUpcomingSeries(),
  ]);

  const trending: TmdbSeries[] = trendingData.results ?? [];
  const upcoming: TmdbSeries[] = upcomingData.results ?? [];

  const hero = trending[0];
  const ranked = trending.slice(1, 5);
  const nextShows = upcoming.slice(0, 4);

  if (!hero) return null;

  const heroSlug = makeSlug(hero.name, hero.id);

  return (
    <main className="px-4 lg:px-0 py-6 flex flex-col gap-10">
      {/* Em alta agora */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              🔥 Em alta agora
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Atualizado diariamente via TMDB · o que o mundo está assistindo hoje
            </p>
          </div>
          <Link
            href="/series"
            className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors shrink-0"
          >
            Ver todas →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 mt-4">
          {/* Card principal — #1 trending */}
          <Link
            href={`/series/${heroSlug}`}
            className="relative rounded-xl overflow-hidden min-h-[260px] lg:min-h-[320px] flex flex-col justify-end group"
          >
            {hero.backdrop_path && (
              <Image
                src={`https://image.tmdb.org/t/p/w1280${hero.backdrop_path}`}
                alt={hero.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="relative z-10 p-5">
              <span className="inline-block bg-[var(--yellow)] text-black text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2">
                #1 Trending hoje
              </span>
              <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5">
                {hero.original_name !== hero.name ? hero.original_name : ""}
              </p>
              <h3 className="text-2xl font-bold text-white leading-tight mb-2">
                {hero.name}
              </h3>
              {hero.overview && (
                <p className="text-sm text-white/70 line-clamp-2 max-w-lg">
                  {hero.overview}
                </p>
              )}
              <div className="flex gap-4 mt-3 text-xs text-white/50">
                {hero.vote_average > 0 && (
                  <span>★ {hero.vote_average.toFixed(1)} TMDB</span>
                )}
                {hero.first_air_date && (
                  <span>{hero.first_air_date.slice(0, 4)}</span>
                )}
              </div>
            </div>
          </Link>

          {/* Ranking lateral 2–5 */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Também em alta
            </p>
            {ranked.map((item, i) => {
              const slug = makeSlug(item.name, item.id);
              return (
                <Link
                  key={item.id}
                  href={`/series/${slug}`}
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                >
                  <span className="text-2xl font-bold text-[var(--text-muted)] w-5 shrink-0">
                    {i + 2}
                  </span>
                  {item.poster_path && (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt={item.name}
                      width={36}
                      height={52}
                      className="rounded object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.vote_average > 0
                        ? `★ ${item.vote_average.toFixed(1)}`
                        : "Sem avaliação"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Em breve */}
      {nextShows.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                📅 Em breve
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Clique em &quot;Quero ser avisado&quot; — te notificamos quando os debates começarem
              </p>
            </div>
            <Link
              href="/em-breve"
              className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors shrink-0"
            >
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            {nextShows.map((item) => {
              const slug = makeSlug(item.name, item.id);
              return (
                <Link
                  key={item.id}
                  href={`/series/${slug}`}
                  className="flex flex-col gap-2 group"
                >
                  <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[var(--bg-surface)]">
                    {item.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-2xl">
                        📺
                      </div>
                    )}
                    {item.first_air_date && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 text-center capitalize">
                        {formatAirDate(item.first_air_date)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

    </main>
  );
}

interface TmdbSeries {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
}

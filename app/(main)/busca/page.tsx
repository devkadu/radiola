import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import Image from "next/image";
import Link from "next/link";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { seriesSlug } from "@/lib/slugs";
import { BuscaInput } from "@/components/BuscaInput/BuscaInput";
import { getSmartAnswer } from "@/lib/smartSearch";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Busca: "${q}"` : "Busca",
    robots: { index: false, follow: false },
  };
}

export default async function BuscaPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="px-4 pt-6 pb-24 flex flex-col gap-6">
        <h1 className="text-[var(--text-primary)] font-bold text-xl">Busca</h1>
        <BuscaInput initialValue="" />
        <div className="flex flex-col items-center gap-3 py-16 text-[var(--text-muted)]">
          <FaMagnifyingGlass size={36} />
          <p className="text-sm">Digite algo para buscar</p>
        </div>
      </div>
    );
  }

  // Busca em paralelo: smart answer + cache local + TMDB
  const [smart, cached, tmdbData] = await Promise.all([
    getSmartAnswer(query),
    cacheService.search(query),
    tmdbService.searchSeries(query),
  ]);

  const cachedSeriesIds = new Set(cached.series.map((s: any) => s.id));
  // Séries do TMDB que ainda não estão no cache
  const tmdbSeries = (tmdbData.results ?? []).filter(
    (s: any) => !cachedSeriesIds.has(s.id)
  );

  const totalCount = cached.series.length + tmdbSeries.length + cached.episodes.length;

  return (
    <div className="px-4 pt-6 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <BuscaInput initialValue={query} />
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-xl">
            Resultados para &ldquo;{query}&rdquo;
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {totalCount} resultado{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Zona inteligente */}
      {smart && (
        <div className="rounded-2xl border border-[var(--yellow)]/20 bg-[var(--yellow)]/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] mb-2">
            ✨ {INTENT_LABEL[smart.type] ?? "resposta rápida"}
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line mb-1">
            <SmartText text={smart.answer} />
          </p>
          {smart.series && smart.series.length > 0 && (
            <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
              {smart.series.map((s) => (
                <Link key={s.id} href={`/series/${s.slug}`} className="shrink-0 flex flex-col gap-1.5 w-20">
                  <div className="w-20 h-[120px] rounded-xl overflow-hidden bg-[var(--bg-elevated)] relative">
                    {s.poster_path ? (
                      <Image src={`https://image.tmdb.org/t/p/w154${s.poster_path}`} alt={s.name} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="80px" />
                    ) : (
                      <div className="w-full h-full bg-[var(--bg-elevated)]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] text-center line-clamp-2 leading-tight">{s.name}</p>
                </Link>
              ))}
            </div>
          )}
          {smart.tags.length > 0 && !smart.series && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {smart.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {totalCount === 0 && !smart && (
        <div className="flex flex-col items-center gap-3 py-20 text-[var(--text-muted)]">
          <FaMagnifyingGlass size={36} />
          <p className="text-sm">Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {/* Episódios do cache */}
      {cached.episodes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Episódios
          </h2>
          <div className="flex flex-col gap-2">
            {cached.episodes.map((ep: any) => {
              const s = ep.series as any;
              return (
                <Link
                  key={ep.id}
                  href={`/series/${s.slug}/temporada-${ep.season_number}/episodio-${ep.episode_number}-${ep.slug.replace(/^episodio-\d+-/, "")}`}
                  className="flex items-center gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-[var(--yellow)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--yellow)] font-medium">{s.name}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      &ldquo;{ep.name}&rdquo;
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.season_number).padStart(2, "0")} · E{String(ep.episode_number).padStart(2, "0")}
                    </p>
                  </div>
                  <span className="text-[var(--text-muted)]">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Séries */}
      {(cached.series.length > 0 || tmdbSeries.length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Séries
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Do cache */}
            {cached.series.map((series: any) => (
              <SeriesCard
                key={series.id}
                slug={series.slug}
                name={series.name}
                posterPath={series.poster_path}
              />
            ))}
            {/* Do TMDB */}
            {tmdbSeries.map((series: any) => (
              <SeriesCard
                key={series.id}
                slug={seriesSlug(series.name, series.id)}
                name={series.name}
                posterPath={series.poster_path}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const INTENT_LABEL: Record<string, string> = {
  material: "📖 material original",
  prod_status: "📺 status de produção",
  similares: "✨ você também vai amar",
  discovery: "🎯 pra você assistir",
};

function SmartText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <span>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="text-[var(--text-primary)] font-semibold">{p}</strong> : p
      )}
    </span>
  );
}

function SeriesCard({
  slug,
  name,
  posterPath,
}: {
  slug: string;
  name: string;
  posterPath: string | null;
}) {
  return (
    <Link href={`/series/${slug}`} className="flex flex-col gap-2 group">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
        {posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${posterPath}`}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs text-center px-2">
            Sem imagem
          </div>
        )}
      </div>
      <p className="text-[var(--text-primary)] text-sm font-medium leading-snug line-clamp-2">
        {name}
      </p>
    </Link>
  );
}

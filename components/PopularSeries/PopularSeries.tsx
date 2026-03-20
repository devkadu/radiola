import { tmdbService } from "@/services/tmdb";
import Image from "next/image";
import Link from "next/link";

const toSlug = (name: string, id: number) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`;

interface Props {
  genreId?: number | null;
}

export const PopularSeries = async ({ genreId }: Props) => {
  const { results } = await tmdbService.getPopularSeries(1, genreId);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--text-muted)]">As comunidades mais ativas esta semana</p>
        <Link href="/series" className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors shrink-0">
          Ver todas →
        </Link>
      </div>

      {/* Mobile: scroll horizontal / Desktop: grid 4 colunas */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible">
        {results.slice(0, 8).map((series: any) => (
          <Link
            key={series.id}
            href={`/series/${toSlug(series.name, series.id)}`}
            className="shrink-0 w-40 lg:w-auto rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--yellow)] transition-colors"
          >
            <div className="relative w-full aspect-[2/3]">
              {series.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                  alt={series.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, 160px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)] text-3xl">
                  📺
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{series.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {series.first_air_date?.split("-")[0] ?? "—"}
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-[var(--yellow-muted)] text-[var(--yellow)]">
                0 debates
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

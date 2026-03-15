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
    <section className="pb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-base font-semibold">Séries populares</h3>
        <Link href="/series" className="text-sm text-[var(--brand-yellow)]">
          Ver todas →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {results.slice(0, 10).map((series: any) => (
          <Link
            key={series.id}
            href={`/series/${toSlug(series.name, series.id)}`}
            className="shrink-0 w-36 rounded-xl overflow-hidden bg-gray-900 border border-[var(--border-muted)] hover:border-[var(--brand-yellow)] transition-colors"
          >
            <div className="relative w-full aspect-[2/3]">
              {series.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                  alt={series.name}
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-3xl">
                  📺
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium truncate">{series.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">0 debates</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

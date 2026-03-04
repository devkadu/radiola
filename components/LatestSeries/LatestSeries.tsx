import { tmdbService } from "@/services/tmdb";
import Image from "next/image";
import Link from "next/link";

export const LatestSeries = async () => {
  const { results } = await tmdbService.getLatestSeries();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pb-24">
      {results.map((series: any) => (
        <Link
          href={`/series/${series.id}`}
          key={series.id}
          className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 border border-transparent hover:border-[var(--brand-yellow)] transition-all"
        >
          {series.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
              alt={series.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-center text-gray-500">
              {series.name}
            </div>
          )}

          {/* Gradiente para legibilidade do texto ao passar o mouse */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <span className="text-white font-medium text-sm truncate w-full">
              {series.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
};

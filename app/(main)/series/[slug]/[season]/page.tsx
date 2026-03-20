import { tmdbService } from "@/services/tmdb";
import { idFromSeriesSlug, numberFromSeasonSlug, episodeSlug } from "@/lib/slugs";
import { BackTopBar } from "@/components/BackTopBar/BackTopBar";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string; season: string }>;
}

export default async function SeasonPage({ params }: Props) {
  const { slug, season: seasonParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);

  const [series, seasonData] = await Promise.all([
    tmdbService.getSeriesDetails(seriesId),
    tmdbService.getSeasonDetails(seriesId, seasonNumber),
  ]);

  return (
    <main className="min-h-screen bg-[var(--background)] text-white pb-24 px-4">
      <BackTopBar href={`/series/${slug}`} title={`${series.name} · ${seasonData.name}`} />

      {/* Header da temporada */}
      <div className="relative -mx-4">
        {series.backdrop_path && (
          <div className="relative h-48 w-full">
            <Image
              src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
              alt={series.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/60 to-transparent" />
          </div>
        )}
        <div className="px-4 pt-4 pb-6 -mt-16 relative z-10">
          <Link
            href={`/series/${slug}`}
            className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← {series.name}
          </Link>
          <div className="flex gap-4 items-end">
            {seasonData.poster_path && (
              <div className="relative w-24 h-36 rounded-xl overflow-hidden shrink-0 border border-gray-700">
                <Image
                  src={`https://image.tmdb.org/t/p/w300${seasonData.poster_path}`}
                  alt={seasonData.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--brand-yellow)] font-medium mb-1">{series.name}</p>
              <h1 className="text-2xl font-bold">{seasonData.name}</h1>
              <div className="flex gap-3 text-sm text-gray-400 mt-1">
                {seasonData.air_date && <span>{seasonData.air_date.split("-")[0]}</span>}
                {seasonData.episodes?.length > 0 && (
                  <span>{seasonData.episodes.length} episódios</span>
                )}
              </div>
            </div>
          </div>
          {seasonData.overview && (
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">{seasonData.overview}</p>
          )}
        </div>
      </div>

      {/* Lista de episódios */}
      <div className="px-4">
        <h2 className="text-base font-semibold mb-3">Episódios</h2>
        <div className="flex flex-col gap-3">
          {seasonData.episodes?.map((ep: any) => (
            <Link
              key={ep.id}
              href={`/series/${slug}/${seasonParam}/${episodeSlug(ep.episode_number, ep.name)}`}
              className="flex gap-3 bg-[#1a1a1a] rounded-xl overflow-hidden border border-[var(--border-muted)] hover:border-[var(--brand-yellow)] transition-colors"
            >
              {ep.still_path ? (
                <div className="relative w-32 h-20 shrink-0">
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div className="w-32 h-20 shrink-0 bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                  S{seasonNumber}E{ep.episode_number}
                </div>
              )}
              <div className="py-3 pr-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 shrink-0">E{ep.episode_number}</span>
                  <p className="text-sm font-medium truncate">{ep.name}</p>
                </div>
                {ep.runtime && (
                  <p className="text-xs text-gray-500 mb-1">{ep.runtime} min</p>
                )}
                {ep.overview && (
                  <p className="text-xs text-gray-500 line-clamp-2">{ep.overview}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

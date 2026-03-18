import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import { seasonSlug } from "@/lib/slugs";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  // Slug format: "nome-da-serie-123" — ID is the last segment
  const id = slug.split("-").pop()!;
  const series = await tmdbService.getSeriesDetails(id);

  // Cacheia série e episódios de todas as temporadas em paralelo
  const seasons = series.seasons?.filter((s: any) => s.season_number > 0) ?? [];
  const seasonDetails = await Promise.all(
    seasons.map((s: any) => tmdbService.getSeasonDetails(id, s.season_number))
  );
  const allEpisodes = seasonDetails.flatMap((s: any) => s.episodes ?? []);
  await Promise.all([
    cacheService.cacheSeries(series),
    cacheService.cacheEpisodes(series.id, allEpisodes),
  ]);

  const trailer = series.videos?.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      {/* Backdrop */}
      {series.backdrop_path && (
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
            alt={series.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/50 to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-20 relative z-10">
        <div className="flex gap-6 items-end mb-8">
          {series.poster_path && (
            <div className="relative w-32 h-48 rounded-xl overflow-hidden shrink-0 border border-gray-700">
              <Image
                src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                alt={series.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{series.name}</h1>
            {series.tagline && (
              <p className="text-[var(--brand-yellow)] italic mb-2">{series.tagline}</p>
            )}
            <div className="flex gap-3 text-sm text-gray-400 flex-wrap">
              {series.first_air_date && (
                <span>{series.first_air_date.split("-")[0]}</span>
              )}
              {series.number_of_seasons && (
                <span>{series.number_of_seasons} temporada{series.number_of_seasons > 1 ? "s" : ""}</span>
              )}
              {series.number_of_episodes && (
                <span>{series.number_of_episodes} episódios</span>
              )}
              {series.vote_average > 0 && (
                <span className="text-[var(--brand-yellow)]">
                  ★ {series.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {series.genres?.map((g: any) => (
                <span
                  key={g.id}
                  className="text-xs px-2 py-1 rounded-full bg-gray-800 border border-gray-700"
                >
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {series.overview && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Sinopse</h2>
            <p className="text-gray-300 leading-relaxed">{series.overview}</p>
          </section>
        )}

        {trailer && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Trailer</h2>
            <div className="aspect-video w-full rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        {/* Temporadas */}
        {series.seasons?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Temporadas</h2>
            <div className="grid gap-3">
              {series.seasons
                .filter((s: any) => s.season_number > 0)
                .map((season: any) => (
                  <Link
                    key={season.id}
                    href={`/series/${slug}/${seasonSlug(season.season_number)}`}
                    className="flex gap-4 items-center bg-gray-900 rounded-xl p-3 border border-gray-800 hover:border-[var(--brand-yellow)] transition-colors"
                  >
                    {season.poster_path ? (
                      <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                          alt={season.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-gray-800 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{season.name}</p>
                      <p className="text-sm text-gray-400">
                        {season.episode_count} episódio{season.episode_count !== 1 ? "s" : ""}
                        {season.air_date ? ` · ${season.air_date.split("-")[0]}` : ""}
                      </p>
                      {season.overview && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{season.overview}</p>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <Link
          href="/"
          className="inline-block text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    </main>
  );
}

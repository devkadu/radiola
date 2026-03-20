import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import { seasonSlug } from "@/lib/slugs";
import { SeriesTopBar } from "@/components/SeriesTopBar/SeriesTopBar";
import Image from "next/image";
import Link from "next/link";
import { FaPlay, FaChevronRight } from "react-icons/fa6";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const id = slug.split("-").pop()!;
  const series = await tmdbService.getSeriesDetails(id);

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

  const releaseYear = series.first_air_date?.split("-")[0];

  return (
    <main className="relative min-h-screen text-white">
      {/* Background blur */}
      {series.backdrop_path && (
        <div className="fixed inset-0 -z-10">
          <Image
            src={`https://image.tmdb.org/t/p/original${series.backdrop_path}`}
            alt=""
            fill
            className="object-cover opacity-20 blur-sm scale-105"
            priority
          />
          <div className="absolute inset-0 bg-[var(--bg)]/80" />
        </div>
      )}

      <div className="px-4 py-6 pb-28">
        <SeriesTopBar
          series={{
            id: series.id,
            name: series.name,
            slug,
            poster_path: series.poster_path ?? null,
          }}
        />

        {/* Title */}
        <h1 className="text-3xl font-bold mb-5">{series.name}</h1>

        {/* Poster + Info */}
        <div className="flex gap-4 mb-6">
          {series.poster_path && (
            <div className="relative w-28 h-40 rounded-xl overflow-hidden shrink-0">
              <Image
                src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                alt={series.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-col justify-between py-1 min-w-0">
            <div>
              {releaseYear && (
                <p className="text-xs text-[var(--yellow)] font-medium mb-1">
                  Lançamento: {releaseYear}
                </p>
              )}
              {series.overview && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-5">
                  {series.overview}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {series.vote_average > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-[var(--yellow)]">
                  ★ {series.vote_average.toFixed(1)}
                </span>
              )}
              {series.genres?.slice(0, 2).map((g: any) => (
                <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Trailer button */}
        {trailer && (
          <a
            href={`https://www.youtube.com/watch?v=${trailer.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-medium hover:border-[var(--yellow)] hover:text-[var(--yellow)] transition-colors mb-6"
          >
            <FaPlay size={12} />
            Ver Trailer
          </a>
        )}

        {/* Seasons list */}
        {seasons.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Temporadas
            </h2>
            <div className="flex flex-col">
              {seasons.map((season: any, i: number) => (
                <Link
                  key={season.id}
                  href={`/series/${slug}/${seasonSlug(season.season_number)}`}
                  className={`flex items-center gap-4 px-4 py-4 hover:bg-[var(--bg-surface)] transition-colors group ${
                    i < seasons.length - 1 ? "border-b border-[var(--border)]" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 text-xs font-bold text-[var(--text-muted)] group-hover:text-[var(--yellow)] transition-colors">
                    T{season.season_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {season.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {season.episode_count} episódio{season.episode_count !== 1 ? "s" : ""}
                      {season.air_date ? ` · ${season.air_date.split("-")[0]}` : ""}
                    </p>
                  </div>
                  <FaChevronRight size={12} className="text-[var(--text-muted)] group-hover:text-[var(--yellow)] transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

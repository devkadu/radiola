import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import { SeriesTopBar } from "@/components/SeriesTopBar/SeriesTopBar";
import { VideoPlayButton } from "@/components/VideoModal/VideoModal";
import { SeasonTabs } from "@/components/SeasonTabs/SeasonTabs";
import Image from "next/image";

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

  const seasonsWithEpisodes = seasonDetails.map((sd: any) => ({
    season_number: sd.season_number,
    name: sd.name,
    episodes: sd.episodes ?? [],
  }));

  const providersData = await tmdbService.getWatchProviders(id).catch(() => ({ results: {} }));
  const brProviders: { logo_path: string; provider_name: string }[] =
    providersData.results?.BR?.flatrate ?? [];

  const trailer = series.videos?.results?.find(
    (v: any) => ["Trailer", "Teaser", "Clip"].includes(v.type) && v.site === "YouTube"
  );

  const releaseYear = series.first_air_date?.split("-")[0];

  return (
    <main className="relative min-h-screen text-white">

      {/* Hero backdrop */}
      <div className="relative w-full aspect-video lg:aspect-auto lg:h-[360px] bg-[var(--bg-elevated)]">
        {series.backdrop_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w1280${series.backdrop_path}`}
            alt={series.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : series.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${series.poster_path}`}
            alt={series.name}
            fill
            className="object-cover object-top"
            sizes="100vw"
            priority
          />
        ) : null}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[var(--bg)]" />

        {/* Play button */}
        {trailer && (
          <VideoPlayButton youtubeKey={trailer.key} title={`Trailer — ${series.name}`} />
        )}

        {/* Top bar overlaid */}
        <div className="absolute inset-x-0 top-0">
          <SeriesTopBar
            heroHeight={150}
            series={{
              id: series.id,
              name: series.name,
              slug,
              poster_path: series.poster_path ?? null,
            }}
          />
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 flex flex-col gap-6">

        {/* Title + meta */}
        <div className="flex gap-4">
          {series.poster_path && (
            <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 -mt-10 ring-2 ring-[var(--border)] shadow-xl">
              <Image
                src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                alt={series.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight">{series.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {releaseYear && (
                <span className="text-xs text-[var(--yellow)] font-medium">{releaseYear}</span>
              )}
              {series.vote_average > 0 && (
                <span className="text-xs font-semibold text-[var(--yellow)]">
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

        {/* Overview */}
        {series.overview && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {series.overview}
          </p>
        )}

        {/* Watch providers */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] shrink-0">Assista em</span>
          {brProviders.length > 0 ? (
            brProviders.map((p) => (
              <div
                key={p.provider_name}
                className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0"
                title={p.provider_name}
              >
                <Image
                  src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                  alt={p.provider_name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            ))
          ) : (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
              Indisponível no Brasil
            </span>
          )}
        </div>

        {/* Seasons + Episodes */}
        {seasonsWithEpisodes.length > 0 && (
          <SeasonTabs slug={slug} seriesId={id} seasons={seasonsWithEpisodes} />
        )}
      </div>
    </main>
  );
}

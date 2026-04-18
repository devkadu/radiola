import { tmdbService } from "@/services/tmdb";
import { cacheService } from "@/services/cache";
import { SeriesTopBar } from "@/components/SeriesTopBar/SeriesTopBar";
import { VideoPlayButton } from "@/components/VideoModal/VideoModal";
import { TrailersSection } from "@/components/TrailerPlayer/TrailersSection";
import { SeasonTabs } from "@/components/SeasonTabs/SeasonTabs";
import { Suspense } from "react";
import { FavoriteButton } from "@/components/FavoriteButton/FavoriteButton";
import { AddToListButton } from "@/components/AddToList/AddToListButton";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = slug.split("-").pop()!;
  const series = await tmdbService.getSeriesDetails(id).catch(() => null);
  if (!series) return {};

  const description =
    series.overview?.slice(0, 155) ??
    `Debate os episódios de ${series.name} no seu ritmo. Comente episódio a episódio.`;
  const image = series.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${series.backdrop_path}`
    : series.poster_path
    ? `https://image.tmdb.org/t/p/w780${series.poster_path}`
    : null;

  return {
    title: series.name,
    description,
    alternates: { canonical: `${siteUrl}/series/${slug}` },
    openGraph: {
      title: series.name,
      description,
      type: "video.tv_show",
      ...(image && { images: [{ url: image, width: 1280, height: 720, alt: series.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: series.name,
      description,
      images: image ? [image] : ["/opengraph-image"],
    },
  };
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase
    .from("series")
    .select("slug")
    .not("slug", "is", null)
    .order("id")
    .limit(60);
  return (data ?? []).map((s) => ({ slug: s.slug }));
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const id = slug.split("-").pop()!;
  const series = await tmdbService.getSeriesDetails(id).catch(() => null);
  if (!series) return <main className="min-h-screen flex items-center justify-center text-[var(--text-muted)]"><p>Série não encontrada.</p></main>;

  const seasons = series.seasons?.filter((s: any) => s.season_number > 0) ?? [];
  const seasonDetails = (
    await Promise.all(
      seasons.map((s: any) => tmdbService.getSeasonDetails(id, s.season_number).catch(() => null))
    )
  ).filter(Boolean);
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

  const [providersData, creditsData] = await Promise.all([
    tmdbService.getWatchProviders(id).catch(() => ({ results: {} })),
    tmdbService.getSeriesCredits(id).catch(() => ({ cast: [] })),
  ]);
  const cast: CastMember[] = (creditsData.cast ?? []).slice(0, 12);
  const brProviders: { logo_path: string; provider_name: string }[] =
    providersData.results?.BR?.flatrate ?? [];

  const allVideos: any[] = series.videos?.results ?? [];
  const trailer = allVideos.find(
    (v) => ["Trailer", "Teaser", "Clip"].includes(v.type) && v.site === "YouTube"
  );
  const trailers = allVideos
    .filter((v) => ["Trailer", "Teaser"].includes(v.type) && v.site === "YouTube")
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
    .slice(0, 5);

  const releaseYear = series.first_air_date?.split("-")[0];

  const seriesUrl = `${siteUrl}/series/${slug}`;
  const seriesImage = series.poster_path
    ? `https://image.tmdb.org/t/p/w780${series.poster_path}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TVSeries",
        "@id": seriesUrl,
        name: series.name,
        ...(series.overview && { description: series.overview }),
        ...(seriesImage && { image: seriesImage }),
        ...(series.first_air_date && { datePublished: series.first_air_date }),
        ...(series.last_air_date && { dateModified: series.last_air_date }),
        ...(series.number_of_seasons && { numberOfSeasons: series.number_of_seasons }),
        ...(series.number_of_episodes && { numberOfEpisodes: series.number_of_episodes }),
        ...(series.genres?.length && { genre: series.genres.map((g: any) => g.name) }),
        ...(series.vote_average > 0 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: series.vote_average.toFixed(1),
            ratingCount: series.vote_count ?? 1,
            bestRating: "10",
            worstRating: "1",
          },
        }),
        url: seriesUrl,
        inLanguage: "pt-BR",
        ...(cast.length > 0 && {
          actor: cast.map((m) => ({
            "@type": "Person",
            name: m.name,
            url: `${siteUrl}/pessoa/${m.id}`,
          })),
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          { "@type": "ListItem", position: 2, name: series.name, item: seriesUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative min-h-screen text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero: poster (esq) + backdrop (dir) no desktop */}
      <div className="relative w-full lg:flex lg:gap-3">

        {/* Poster — esquerda no desktop */}
        {series.poster_path && (
          <div className="hidden lg:block relative w-[280px] shrink-0 h-[420px] bg-[var(--bg-elevated)]">
            <Image
              src={`https://image.tmdb.org/t/p/w342${series.poster_path}`}
              alt={series.name}
              fill
              className="object-cover"
              sizes="280px"
              priority
            />
            {/* fade suave para o backdrop à direita */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg)]/40" />
          </div>
        )}

        {/* Backdrop */}
        <div className="relative flex-1 aspect-video lg:aspect-auto lg:h-[420px] bg-[var(--bg-elevated)]">
          {series.backdrop_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w780${series.backdrop_path}`}
              alt={series.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 75vw"
              priority
              fetchPriority="high"
            />
          ) : series.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
              alt={series.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 75vw"
              priority
              fetchPriority="high"
            />
          ) : null}

          {/* Gradient: mobile fade para baixo / desktop fade para esquerda (junta com o poster) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[var(--bg)] lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-[var(--bg)]/60" />

          {/* Play button */}
          {trailer && (
            <VideoPlayButton youtubeKey={trailer.key} title={`Trailer — ${series.name}`} />
          )}

          {/* Top bar */}
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
      </div>

      <div className="px-4 lg:px-8 pt-5 pb-28 flex flex-col gap-5">

        {/* Info: título + botão numa linha, chips na linha de baixo */}
        <div className="flex flex-col gap-1.5">

          {/* Linha 1: poster | título | botão */}
          <div className="flex items-center gap-3">
            {series.poster_path && (
              <div className="lg:hidden w-20 h-28 rounded-xl overflow-hidden shrink-0 -mt-12 ring-2 ring-[var(--border)] shadow-xl">
                <Image
                  src={`https://image.tmdb.org/t/p/w185${series.poster_path}`}
                  alt={series.name}
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold leading-none flex-1 min-w-0">{series.name}</h1>
          </div>

          {/* Linha 2: chips — largura total */}
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Overview — ocupa toda a largura disponível */}
        {series.overview && (
          <p className="text-sm lg:text-base text-[var(--text-secondary)] leading-relaxed">
            {series.overview}
          </p>
        )}

        {/* Ações — mobile */}
        <div className="lg:hidden flex gap-2">
          <div className="flex-1">
            <FavoriteButton
              series={{ id: series.id, name: series.name, slug, poster_path: series.poster_path ?? null }}
              variant="list"
              fullWidth
            />
          </div>
          <AddToListButton
            seriesId={series.id}
            seriesName={series.name}
            posterPath={series.poster_path ?? null}
            seriesSlug={slug}
          />
        </div>

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
          {/* Ações — desktop */}
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <AddToListButton
              seriesId={series.id}
              seriesName={series.name}
              posterPath={series.poster_path ?? null}
              seriesSlug={slug}
            />
            <FavoriteButton
              series={{ id: series.id, name: series.name, slug, poster_path: series.poster_path ?? null }}
              variant="list"
            />
          </div>
        </div>

        {/* Elenco */}
        {cast.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">Elenco principal</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {cast.map((member) => (
                <Link
                  key={member.id}
                  href={`/pessoa/${member.id}`}
                  className="shrink-0 w-20 flex flex-col gap-1 group"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[var(--bg-elevated)] ring-2 ring-[var(--border)] group-hover:ring-[var(--yellow)] transition-all">
                    {member.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-[var(--text-muted)]">
                        👤
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] text-center line-clamp-1 leading-tight">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] text-center line-clamp-1 leading-tight">
                    {member.character}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trailers com comentários por timestamp */}
        {trailers.length > 0 && (
          <TrailersSection trailers={trailers} seriesId={id} />
        )}

        {/* Seasons + Episodes */}
        {seasonsWithEpisodes.length > 0 && (
          <Suspense fallback={null}>
            <SeasonTabs slug={slug} seriesId={id} seasons={seasonsWithEpisodes} />
          </Suspense>
        )}
      </div>
    </main>
  );
}

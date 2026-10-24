import { withCatalogNotFound } from "@/features/catalog/server/queries/with-catalog-not-found";
import { getEpisodeDetails } from "@/server/integrations/tmdb/requests/get-episode-details";
import { getEpisodeVideos } from "@/server/integrations/tmdb/requests/get-episode-videos";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { serializeJsonLd } from "@/shared/utils/serialize-json-ld";

import {
idFromSeriesSlug,
numberFromEpisodeSlug,
numberFromSeasonSlug,
} from "@/features/catalog/utils/slugs";

import { EpisodeReactions } from "@/features/discussions/components/episode-reactions/episode-reactions";

import { BackTopBar } from "@/shared/components/back-top-bar/back-top-bar";

import { episodeId } from "@/features/progress/functions/episode-id";

import { supabase } from "@/server/database/public";

import { CollapsibleSinopse } from "@/features/catalog/components/series-synopsis/series-synopsis";
import { ShareEpisodeButton } from "@/features/catalog/components/share-episode-button/share-episode-button";

import { EpisodeCommentsSection } from "@/features/discussions/components/episode-comments-section/episode-comments-section.client";

import { EpisodeVideoButton } from "@/features/catalog/components/episode-video-button/episode-video-button.client";

import { WatchedBadge } from "@/features/progress/components/watched-badge/watched-badge.client";

import { EpisodeRatingOverlay } from "@/features/discussions/components/episode-rating-overlay/episode-rating-overlay.client";

import Image from "@/shared/components/image/image";

import Link from "next/link";


interface Props {
  params: Promise<{ slug: string; season: string; episode: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00")
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/\s+de\s+/g, " ");
}

export async function EpisodeDetailsView({ params }: Props) {
  const { slug, season: seasonParam, episode: episodeParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);
  const episodeNumber = numberFromEpisodeSlug(episodeParam);

  const computedEpisodeId = episodeId(seriesId, seasonNumber, episodeNumber);

  const [series, ep, videos, reactionsResult, commentsResult] = await Promise.all([
    withCatalogNotFound(getSeriesDetails(seriesId)),
    withCatalogNotFound(getEpisodeDetails(seriesId, seasonNumber, episodeNumber)),
    getEpisodeVideos(seriesId, seasonNumber, episodeNumber).catch(() => ({ results: [] })),
    supabase.from("episode_reactions").select("reaction_key").eq("episode_id", computedEpisodeId),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("episode_id", computedEpisodeId),
  ]);

  const youtubeVideo = (videos?.results ?? []).find(
    (v: { site: string; type: string; key: string }) =>
      v.site === "YouTube" && ["Trailer", "Clip", "Teaser", "Featurette"].includes(v.type)
  );

  const ratings = (reactionsResult.data ?? [])
    .map((r) => parseInt(r.reaction_key))
    .filter((n) => !isNaN(n));
  const ratingCount = ratings.length;
  const ratingValue = ratingCount > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratingCount
    : 0;
  const commentCount = commentsResult.count ?? 0;

  const genres: { id: number; name: string }[] = series.genres ?? [];

  const seasonLabel = `T${String(seasonNumber).padStart(2, "0")}`;
  const episodeLabel = `E${String(episodeNumber).padStart(2, "0")}`;
  const runtimeLabel = ep.runtime ? `${ep.runtime} min` : null;

  const placeholder = `Sem medo — aqui só quem chegou até o ${seasonLabel}·${episodeLabel}...`;

  const episodeUrl = `${siteUrl}/series/${slug}/${seasonParam}/${episodeParam}`;
  const seriesUrl = `${siteUrl}/series/${slug}`;
  const seasonUrl = `${siteUrl}/series/${slug}/${seasonParam}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TVEpisode",
        "@id": episodeUrl,
        name: ep.name,
        episodeNumber: episodeNumber,
        ...(ep.overview && { description: ep.overview }),
        ...(ep.air_date && { datePublished: ep.air_date }),
        ...(ep.runtime && { duration: `PT${ep.runtime}M` }),
        ...(ep.still_path && { image: `https://image.tmdb.org/t/p/w780${ep.still_path}` }),
        url: episodeUrl,
        partOfSeason: {
          "@type": "TVSeason",
          seasonNumber: seasonNumber,
          url: seasonUrl,
        },
        partOfTVSeries: {
          "@type": "TVSeries",
          name: series.name,
          url: seriesUrl,
        },
        ...(ratingCount >= 3 && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingValue.toFixed(1),
            ratingCount,
            bestRating: "5",
            worstRating: "1",
          },
        }),
        ...(commentCount > 0 && {
          interactionStatistic: {
            "@type": "InteractionCounter",
            interactionType: "https://schema.org/CommentAction",
            userInteractionCount: commentCount,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          { "@type": "ListItem", position: 2, name: series.name, item: seriesUrl },
          { "@type": "ListItem", position: 3, name: `Temporada ${seasonNumber}`, item: seasonUrl },
          { "@type": "ListItem", position: 4, name: ep.name, item: episodeUrl },
        ],
      },
    ],
  };

  return (
    <main className="pb-[200px] lg:pb-0 text-white lg:grid lg:grid-cols-[60fr_40fr] lg:h-full lg:overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* LEFT column — hero + info + reactions */}
      <div className="flex flex-col lg:overflow-y-auto">

        {/* Hero image */}
        <div className="relative w-full aspect-video lg:aspect-auto lg:h-[320px] bg-[var(--bg-elevated)]">
          {ep.still_path ? (
            <Image tmdbKind="still"
              src={`https://image.tmdb.org/t/p/w780${ep.still_path}`}
              alt={ep.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 65vw, 100vw"
              priority
              fetchPriority="high"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-[var(--text-muted)]">
              📺
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

          {youtubeVideo && (
            <EpisodeVideoButton youtubeKey={youtubeVideo.key} title={ep.name} />
          )}

          <div className="absolute inset-x-0 top-0">
            <BackTopBar href={`/series/${slug}`} title={ep.name} />
          </div>

          <EpisodeRatingOverlay episodeId={computedEpisodeId} />
        </div>

        {/* Episode info */}
        <div className="px-4 pt-4 flex flex-col gap-4 lg:px-6 lg:py-6">
          <div className="flex flex-col gap-1.5">
            <Link
              href={`/series/${slug}`}
              className="text-xs font-bold uppercase tracking-wider text-[var(--yellow)] hover:opacity-80 transition-opacity"
            >
              {series.name} · {seasonLabel}
            </Link>

            <h1 className="text-xl font-bold leading-snug">
              &ldquo;{ep.name}&rdquo;
            </h1>

            <p className="text-xs text-[var(--text-muted)]">
              {episodeLabel}
              {runtimeLabel && ` · ${runtimeLabel}`}
              {ep.air_date && ` · ${formatDate(ep.air_date)}`}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {genres.slice(0, 2).map((g) => (
                <span
                  key={g.id}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
                >
                  {g.name}
                </span>
              ))}
              <WatchedBadge episodeId={computedEpisodeId} />
              <ShareEpisodeButton seriesName={series.name} episodeName={ep.name} />
            </div>

            {ep.overview && <CollapsibleSinopse overview={ep.overview} />}
          </div>

          <EpisodeReactions episodeId={computedEpisodeId} />

          {/* Mobile only: comments */}
          <div className="lg:hidden">
            <EpisodeCommentsSection
              seriesId={seriesId}
              seasonNumber={seasonNumber}
              episodeNumber={episodeNumber}
              placeholder={placeholder}
              episodeTitle={`"${ep.name}" · ${series.name} ${seasonLabel}${episodeLabel}`}
              episodeUrl={`/series/${slug}/${seasonParam}/${episodeParam}`}
              fichaTecnica={{
                airDate: ep.air_date ?? null,
                runtime: ep.runtime ?? null,
                productionCode: ep.production_code ?? null,
                crew: ep.crew ?? [],
                guestStars: ep.guest_stars ?? [],
              }}
            />
          </div>
        </div>

      </div>

      {/* RIGHT column — comments full height (desktop only) */}
      <div className="hidden lg:flex flex-col border-l border-[var(--border)] overflow-y-auto">
        <EpisodeCommentsSection
          seriesId={seriesId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          placeholder={placeholder}
          episodeTitle={`"${ep.name}" · ${series.name} ${seasonLabel}${episodeLabel}`}
          episodeUrl={`/series/${slug}/${seasonParam}/${episodeParam}`}
          fichaTecnica={{
            airDate: ep.air_date ?? null,
            runtime: ep.runtime ?? null,
            productionCode: ep.production_code ?? null,
            crew: ep.crew ?? [],
            guestStars: ep.guest_stars ?? [],
          }}
        />
      </div>

    </main>
  );
}

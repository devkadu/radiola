import { tmdbService } from "@/services/tmdb";
import {
  idFromSeriesSlug,
  numberFromSeasonSlug,
  numberFromEpisodeSlug,
} from "@/lib/slugs";
import { EpisodeReactions } from "@/components/EpisodeReactions/EpisodeReactions";
import { BackTopBar } from "@/components/BackTopBar/BackTopBar";
import { episodeId } from "@/services/comments";
import { CommentCTA, CollapsibleSinopse } from "./_components";
import { EpisodeCommentsSection } from "./_section";
import { EpisodeVideoButton } from "./_video";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; season: string; episode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, season: seasonParam, episode: episodeParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);
  const episodeNumber = numberFromEpisodeSlug(episodeParam);

  const [series, ep] = await Promise.all([
    tmdbService.getSeriesDetails(seriesId).catch(() => null),
    tmdbService.getEpisodeDetails(seriesId, seasonNumber, episodeNumber).catch(() => null),
  ]);

  if (!series || !ep) return {};

  const seasonLabel = `T${String(seasonNumber).padStart(2, "0")}`;
  const episodeLabel = `E${String(episodeNumber).padStart(2, "0")}`;
  const title = `"${ep.name}" · ${series.name} ${seasonLabel}${episodeLabel}`;
  const description =
    ep.overview?.slice(0, 160) ??
    `Debate o episódio ${episodeLabel} da ${seasonLabel} de ${series.name} sem spoilers.`;
  const image = ep.still_path
    ? `https://image.tmdb.org/t/p/w780${ep.still_path}`
    : null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.episode",
      ...(image && { images: [{ url: image, width: 780, height: 439, alt: ep.name }] }),
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00")
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/\s+de\s+/g, " ");
}

export default async function EpisodePage({ params }: Props) {
  const { slug, season: seasonParam, episode: episodeParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);
  const episodeNumber = numberFromEpisodeSlug(episodeParam);

  const [series, ep, videos] = await Promise.all([
    tmdbService.getSeriesDetails(seriesId).catch(() => null),
    tmdbService.getEpisodeDetails(seriesId, seasonNumber, episodeNumber).catch(() => null),
    tmdbService.getEpisodeVideos(seriesId, seasonNumber, episodeNumber).catch(() => ({ results: [] })),
  ]);

  const youtubeVideo = (videos?.results ?? []).find(
    (v: { site: string; type: string; key: string }) =>
      v.site === "YouTube" && ["Trailer", "Clip", "Teaser", "Featurette"].includes(v.type)
  );

  if (!series || !ep) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <p className="text-4xl">📺</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">Episódio não encontrado</p>
        <p className="text-sm">Verifique se o link está correto.</p>
        <Link href="/" className="mt-2 text-sm text-[var(--yellow)] hover:underline">
          ← Voltar para o início
        </Link>
      </main>
    );
  }

  const computedEpisodeId = episodeId(seriesId, seasonNumber, episodeNumber);
  const genres: { id: number; name: string }[] = series.genres ?? [];

  const seasonLabel = `T${String(seasonNumber).padStart(2, "0")}`;
  const episodeLabel = `E${String(episodeNumber).padStart(2, "0")}`;
  const runtimeLabel = ep.runtime ? `${ep.runtime} min` : null;

  const placeholder = `Sem medo — aqui só quem chegou até o ${seasonLabel}·${episodeLabel}...`;

  return (
    <main className="min-h-screen pb-32 text-white">

      {/* Hero image — full width, 16:9 */}
      <div className="relative w-full aspect-video lg:aspect-auto lg:h-[320px] bg-[var(--bg-elevated)]">
        {ep.still_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${ep.still_path}`}
            alt={ep.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-[var(--text-muted)]">
            📺
          </div>
        )}
        {/* Gradient overlay so BackTopBar is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Play button — only if YouTube video available */}
        {youtubeVideo && (
          <EpisodeVideoButton youtubeKey={youtubeVideo.key} title={ep.name} />
        )}

        {/* Back top bar — overlaid on image */}
        <div className="absolute inset-x-0 top-0">
          <BackTopBar href={`/series/${slug}`} title={ep.name} />
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">

        {/* Episode info */}
        <div className="flex flex-col gap-1.5">
          {/* Series name · season */}
          <Link
            href={`/series/${slug}`}
            className="text-xs font-bold uppercase tracking-wider text-[var(--yellow)] hover:opacity-80 transition-opacity"
          >
            {series.name} · {seasonLabel}
          </Link>

          {/* Episode title */}
          <p className="text-xl font-bold leading-snug">
            &ldquo;{ep.name}&rdquo;
          </p>

          {/* Meta: E01 · 45 min · date */}
          <p className="text-xs text-[var(--text-muted)]">
            {episodeLabel}
            {runtimeLabel && ` · ${runtimeLabel}`}
            {ep.air_date && ` · ${formatDate(ep.air_date)}`}
          </p>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#2a2516] border border-[#4a3e1a] text-[var(--yellow)]">
              Spoiler-free
            </span>
            {ep.vote_average > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#1f2d1a] border border-[#2d4a1e] text-green-400">
                {ep.vote_average.toFixed(1)} TMDB
              </span>
            )}
            {genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
              >
                {g.name}
              </span>
            ))}
          </div>

          {/* Collapsible sinopse */}
          {ep.overview && <CollapsibleSinopse overview={ep.overview} />}
        </div>

        {/* Reactions */}
        <EpisodeReactions episodeId={computedEpisodeId} />

        {/* Comments + Drawer */}
        <EpisodeCommentsSection
          seriesId={seriesId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          placeholder={placeholder}
        />

      </div>

      {/* Fixed bottom CTA — above bottom nav on mobile, bottom-right on desktop */}
      <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 px-4 z-30 pointer-events-none">
        <div className="max-w-[1296px] mx-auto flex justify-end pointer-events-auto">
          <CommentCTA />
        </div>
      </div>
    </main>
  );
}

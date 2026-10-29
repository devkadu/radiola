import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { resolveEpisodePage } from "../queries/resolve-catalog-page";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; season: string; episode: string }>;
}

export async function generateStaticParams() {
  const { supabase } = await import("@/server/database/public");
  const { seasonSlug } = await import("@/features/catalog/utils/slugs");

  // Top 20 séries (por id = mais antigas/populares) com todos os seus episódios
  const { data: seriesList } = await supabase
    .from("series")
    .select("slug, id")
    .not("slug", "is", null)
    .order("id")
    .limit(20);

  if (!seriesList?.length) return [];

  const { data: episodes } = await supabase
    .from("episodes")
    .select("slug, season_number, episode_number, series_id")
    .in("series_id", seriesList.map((s) => s.id));

  if (!episodes?.length) return [];

  const seriesById = Object.fromEntries(seriesList.map((s) => [s.id, s.slug]));

  return episodes.flatMap((ep) => {
    const seriesSlugVal = seriesById[ep.series_id];
    if (!seriesSlugVal) return [];
    return [{
      slug: seriesSlugVal,
      season: seasonSlug(ep.season_number),
      episode: ep.slug,
    }];
  });
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug, season: seasonParam, episode: episodeParam } = await params;
  const { series, episode: ep, seasonNumber, episodeNumber, path } = await resolveEpisodePage(slug, seasonParam, episodeParam);

  const seasonLabel = `T${String(seasonNumber).padStart(2, "0")}`;
  const episodeLabel = `E${String(episodeNumber).padStart(2, "0")}`;
  const titleBase = `${series.name} ${seasonLabel}${episodeLabel}`;
  const available = 50 - titleBase.length - 5; // 5 = ` · ""`
  const safeEpName = available >= 5
    ? (ep.name.length > available ? ep.name.slice(0, available - 1) + "…" : ep.name)
    : null;
  const title = safeEpName ? `"${safeEpName}" · ${titleBase}` : titleBase;
  const description =
    ep.overview?.slice(0, 155) ??
    `Debate o episódio ${episodeLabel} da ${seasonLabel} de ${series.name}.`;
  const image = ep.still_path
    ? `https://image.tmdb.org/t/p/w780${ep.still_path}`
    : series.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${series.backdrop_path}`
    : null;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}${path}` },
    openGraph: {
      title,
      description,
      type: "video.episode",
      ...(image && { images: [{ url: image, width: 780, height: 439, alt: ep.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : ["/opengraph-image"],
    },
  };
};

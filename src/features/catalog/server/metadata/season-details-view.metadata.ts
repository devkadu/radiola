import { getSeasonDetails } from "@/server/integrations/tmdb/requests/get-season-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";

import { idFromSeriesSlug,numberFromSeasonSlug } from "@/features/catalog/utils/slugs";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; season: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, season: seasonParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);

  const [series, seasonData] = await Promise.all([
    getSeriesDetails(seriesId).catch(() => null),
    getSeasonDetails(seriesId, seasonNumber).catch(() => null),
  ]);

  if (!series || !seasonData) return {};

  const title = `${series.name} — ${seasonData.name}`;
  const description =
    seasonData.overview?.slice(0, 155) ??
    `Debate os episódios da ${seasonData.name} de ${series.name}.`;
  const canonical = `${siteUrl}/series/${slug}/${seasonParam}`;
  const image = seasonData.poster_path
    ? `https://image.tmdb.org/t/p/w780${seasonData.poster_path}`
    : series.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${series.backdrop_path}`
    : null;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "video.tv_show",
      ...(image && { images: [{ url: image, width: 780, height: 439, alt: title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : ["/opengraph-image"],
    },
  };
}

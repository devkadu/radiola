import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { resolveSeasonPage } from "../queries/resolve-catalog-page";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; season: string }>;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug, season: seasonParam } = await params;
  const { series, season: seasonData, path } = await resolveSeasonPage(slug, seasonParam);

  const title = `${series.name} — ${seasonData.name}`;
  const description =
    seasonData.overview?.slice(0, 155) ??
    `Debate os episódios da ${seasonData.name} de ${series.name}.`;
  const canonical = `${siteUrl}${path}`;
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
};

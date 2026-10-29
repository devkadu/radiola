import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { resolveSeriesPage } from "../queries/resolve-catalog-page";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const { series, path } = await resolveSeriesPage(slug);

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
    alternates: { canonical: `${siteUrl}${path}` },
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
};

export async function generateStaticParams() {
  const { supabase } = await import("@/server/database/public");
  const { data } = await supabase
    .from("series")
    .select("slug")
    .not("slug", "is", null)
    .order("id")
    .limit(60);
  return (data ?? []).map((s) => ({ slug: s.slug }));
}

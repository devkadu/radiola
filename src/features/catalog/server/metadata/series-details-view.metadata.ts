import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = slug.split("-").pop()!;
  const series = await getSeriesDetails(id).catch(() => null);
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

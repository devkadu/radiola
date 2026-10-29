import { BEST_SERIES_PLATFORMS as PLATFORMS } from "@/features/catalog/constants/best-series";
import { SITE_URL as siteUrl } from "@/shared/constants/site";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ plataforma: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { plataforma } = await params;
  const platform = PLATFORMS[plataforma];
  if (!platform) return {};

  const title = `As 10 Melhores Séries do ${platform.name} (${new Date().getFullYear()})`;
  return {
    title,
    description: platform.description,
    alternates: { canonical: `${siteUrl}/melhores/${platform.slug}` },
    openGraph: { title, description: platform.description, type: "article" },
  };
}

export async function generateStaticParams() {
  return Object.keys(PLATFORMS).map((p) => ({ plataforma: p }));
}

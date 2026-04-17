import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, priority: 1, changeFrequency: "daily" },
    { url: `${siteUrl}/series`, priority: 0.8, changeFrequency: "daily" },
    { url: `${siteUrl}/debates`, priority: 0.6, changeFrequency: "weekly" },
  ];

  const { data: seriesList } = await supabase
    .from("series")
    .select("slug")
    .order("id");

  const seriesPages: MetadataRoute.Sitemap = (seriesList ?? []).map((s) => ({
    url: `${siteUrl}/series/${s.slug}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  const { data: episodes } = await supabase
    .from("episodes")
    .select("slug, season_number, episode_number, series(slug)")
    .order("id");

  const episodePages: MetadataRoute.Sitemap = (episodes ?? []).map((ep) => {
    const seriesSlug = (ep.series as any)?.slug ?? "";
    return {
      url: `${siteUrl}/series/${seriesSlug}/temporada-${ep.season_number}/${ep.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    };
  });

  return [...staticPages, ...seriesPages, ...episodePages];
}

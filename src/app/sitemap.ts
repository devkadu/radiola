import { supabase } from "@/server/database/public";
import { readAll } from "@/server/database/read-all";
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl,                    priority: 1.0, changeFrequency: "daily"   },
    { url: `${siteUrl}/series`,        priority: 0.9, changeFrequency: "daily"   },
    { url: `${siteUrl}/debates`,       priority: 0.8, changeFrequency: "daily"   },
    { url: `${siteUrl}/em-breve`,      priority: 0.6, changeFrequency: "weekly"  },
  ];

  const seriesList = await readAll<{ slug: string }>((from, to) => supabase
    .from("series").select("slug").order("id").range(from, to));

  const seriesPages: MetadataRoute.Sitemap = (seriesList ?? []).map((s) => ({
    url: `${siteUrl}/series/${s.slug}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  const episodes = await readAll<{ slug: string; season_number: number; episode_number: number; series: { slug: string } | null }>((from, to) => supabase
    .from("episodes")
    .select("slug, season_number, episode_number, series(slug)")
    .order("id").range(from, to).returns<{ slug: string; season_number: number; episode_number: number; series: { slug: string } | null }[]>());

  const episodePages: MetadataRoute.Sitemap = episodes.filter(ep => ep.series).map((ep) => {
    const seriesSlug = ep.series!.slug;
    return {
      url: `${siteUrl}/series/${seriesSlug}/temporada-${ep.season_number}/${ep.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    };
  });

  return [...staticPages, ...seriesPages, ...episodePages];
}

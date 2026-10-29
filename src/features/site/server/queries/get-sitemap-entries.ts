import "server-only";

import { BEST_SERIES_PLATFORMS } from "@/features/catalog/constants/best-series";
import {
  isEpisodeSlugForNumber,
  isSafeSlug,
  isSeriesSlugForId,
} from "@/features/catalog/utils/canonical-slugs";
import { seasonSlug } from "@/features/catalog/utils/slugs";
import { readAll } from "@/server/database/read-all";
import { supabase } from "@/server/database/public";
import { supabaseAdmin } from "@/server/database/admin";
import { SITE_URL } from "@/shared/constants/site";
import type { MetadataRoute } from "next";

interface SeriesRow {
  id: number;
  slug: string | null;
}
interface EpisodeRow {
  series_id: number;
  season_number: number;
  episode_number: number;
  slug: string | null;
}
interface ArticleRow {
  slug: string | null;
  published_at: string | null;
  updated_at: string | null;
}

const lastModified = (article: ArticleRow) => {
  const dates = [article.updated_at, article.published_at]
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date).getTime())
    .filter((date) => Number.isFinite(date) && date <= Date.now());
  return dates.length ? new Date(Math.max(...dates)).toISOString() : undefined;
};

export const getSitemapEntries = async (): Promise<MetadataRoute.Sitemap> => {
  const [series, episodes, articles] = await Promise.all([
    readAll<SeriesRow>((from, to) =>
      supabase
        .from("series")
        .select("id, slug")
        .not("slug", "is", null)
        .order("id")
        .range(from, to),
    ),
    readAll<EpisodeRow>((from, to) =>
      supabase
        .from("episodes")
        .select("series_id, season_number, episode_number, slug")
        .not("slug", "is", null)
        .order("id")
        .range(from, to),
    ),
    readAll<ArticleRow>((from, to) =>
      supabaseAdmin
        .from("articles")
        .select("slug, published_at, updated_at")
        .eq("status", "published")
        .not("slug", "is", null)
        .order("id")
        .range(from, to),
    ),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: "daily" },
    ...["series", "comunidade", "debates", "em-breve"].map((page) => ({
      url: `${SITE_URL}/${page}`,
      priority: 0.8,
      changeFrequency: "daily" as const,
    })),
    ...Object.values(BEST_SERIES_PLATFORMS).map((platform) => ({
      url: `${SITE_URL}/melhores/${platform.slug}`,
      priority: 0.7,
      changeFrequency: "weekly" as const,
    })),
  ];
  const seriesPaths = new Map<number, string>();
  for (const row of series) {
    if (!isSeriesSlugForId(row.slug, row.id)) continue;
    const path = `${SITE_URL}/series/${row.slug}`;
    seriesPaths.set(row.id, path);
    entries.push({ url: path, priority: 0.7, changeFrequency: "weekly" });
  }

  const seasons = new Set<string>();
  for (const episode of episodes) {
    const parent = seriesPaths.get(episode.series_id);
    if (
      !parent ||
      !Number.isSafeInteger(episode.season_number) ||
      episode.season_number < 0 ||
      !isEpisodeSlugForNumber(episode.slug, episode.episode_number)
    )
      continue;
    const seasonUrl = `${parent}/${seasonSlug(episode.season_number)}`;
    seasons.add(seasonUrl);
    entries.push({
      url: `${seasonUrl}/${episode.slug}`,
      priority: 0.6,
      changeFrequency: "monthly",
    });
  }
  seasons.forEach((url) => entries.push({ url, priority: 0.6, changeFrequency: "weekly" }));

  for (const article of articles) {
    if (!isSafeSlug(article.slug)) continue;
    const date = lastModified(article);
    entries.push({
      url: `${SITE_URL}/artigos/${article.slug}`,
      priority: 0.7,
      changeFrequency: "weekly",
      ...(date && { lastModified: date }),
    });
  }
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
};

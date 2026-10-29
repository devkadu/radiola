import "server-only";

import {
  isEpisodeSlugForNumber,
  isSeriesSlugForId,
} from "@/features/catalog/utils/canonical-slugs";
import { episodeSlug, seasonSlug, seriesSlug } from "@/features/catalog/utils/slugs";
import { supabase } from "@/server/database/public";
import { getEpisodeDetails } from "@/server/integrations/tmdb/requests/get-episode-details";
import { getSeasonDetails } from "@/server/integrations/tmdb/requests/get-season-details";
import { getSeriesDetails } from "@/server/integrations/tmdb/requests/get-series-details";
import { notFound } from "next/navigation";
import { cache } from "react";
import { withCatalogNotFound } from "./with-catalog-not-found";

const parseNumber = (value: string | undefined, minimum: number): number => {
  if (!value || !/^\d+$/.test(value)) notFound();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) notFound();
  return number;
};

const readSeriesIdentity = cache(async (requestedSlug: string) => {
  const id = parseNumber(requestedSlug.split("-").pop(), 1);
  const [series, stored] = await Promise.all([
    withCatalogNotFound(getSeriesDetails(String(id))),
    supabase.from("series").select("slug").eq("id", id).maybeSingle(),
  ]);
  if (stored.error) throw stored.error;
  const slug = isSeriesSlugForId(stored.data?.slug, id)
    ? stored.data.slug
    : seriesSlug(series.name, id);
  return { series, id, slug, path: `/series/${slug}` };
});

export const resolveSeriesPage = async (requestedSlug: string) => {
  const identity = await readSeriesIdentity(requestedSlug);
  return identity;
};

export const resolveSeasonPage = async (requestedSlug: string, requestedSeason: string) => {
  const seasonNumber = parseNumber(requestedSeason.match(/^temporada-(\d+)$/)?.[1], 0);
  // Validate the ID before starting a season request.
  const id = parseNumber(requestedSlug.split("-").pop(), 1);
  const [identity, season] = await Promise.all([
    readSeriesIdentity(requestedSlug),
    withCatalogNotFound(getSeasonDetails(String(id), seasonNumber)),
  ]);
  const seasonParam = seasonSlug(seasonNumber);
  const path = `${identity.path}/${seasonParam}`;
  return { ...identity, season, seasonNumber, seasonParam, path };
};

const readEpisodeSlug = cache(async (id: number, seasonNumber: number, episodeNumber: number) => {
  const { data, error } = await supabase
    .from("episodes")
    .select("slug")
    .eq("series_id", id)
    .eq("season_number", seasonNumber)
    .eq("episode_number", episodeNumber)
    .order("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.slug;
});

export const resolveEpisodePage = async (
  requestedSlug: string,
  requestedSeason: string,
  requestedEpisode: string,
) => {
  const id = parseNumber(requestedSlug.split("-").pop(), 1);
  const seasonNumber = parseNumber(requestedSeason.match(/^temporada-(\d+)$/)?.[1], 0);
  const episodeNumber = parseNumber(requestedEpisode.match(/^episodio-(\d+)(?:-.*)?$/)?.[1], 1);
  const [identity, episode, stored] = await Promise.all([
    readSeriesIdentity(requestedSlug),
    withCatalogNotFound(getEpisodeDetails(String(id), seasonNumber, episodeNumber)),
    readEpisodeSlug(id, seasonNumber, episodeNumber),
  ]);
  const episodeParam = isEpisodeSlugForNumber(stored, episodeNumber)
    ? stored
    : episodeSlug(episodeNumber, episode.name);
  const seasonParam = seasonSlug(seasonNumber);
  const seriesPath = identity.path;
  const seasonPath = `${seriesPath}/${seasonParam}`;
  const path = `${seasonPath}/${episodeParam}`;
  return {
    ...identity,
    episode,
    episodeNumber,
    episodeParam,
    seasonNumber,
    seasonParam,
    seriesPath,
    seasonPath,
    path,
  };
};

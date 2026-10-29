import "server-only";

import { isHTTPAccessFallbackError } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { resolveEpisodePage, resolveSeasonPage, resolveSeriesPage } from "./resolve-catalog-page";

const TTL = 60 * 60 * 1000;
const MAX_ENTRIES = 1000;
const paths = new Map<string, { expires: number; value: Promise<string | null> }>();

// Resolve before rendering: cached ISR redirects in Next can duplicate Location on the first miss.
// Cache by catalog coordinates, so alternate names share a single bounded lookup.
export const getCatalogCanonicalPath = async (pathname: string): Promise<string | null> => {
  const parts = pathname.split("/").slice(1);
  if (parts[0] !== "series" || parts.length < 2 || parts.length > 4) return null;
  const [, slug, season, episode] = parts;
  const id = Number(slug.split("-").pop());
  const seasonNumber =
    season === undefined ? undefined : Number(season.match(/^temporada-(\d+)$/)?.[1]);
  const episodeNumber =
    episode === undefined ? undefined : Number(episode.match(/^episodio-(\d+)(?:-.*)?$/)?.[1]);
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    (season !== undefined && (!Number.isSafeInteger(seasonNumber) || seasonNumber! < 0)) ||
    (episode !== undefined && (!Number.isSafeInteger(episodeNumber) || episodeNumber! < 1))
  )
    return null;
  const key = [id, seasonNumber, episodeNumber].join(":");
  const now = Date.now();
  const cached = paths.get(key);
  if (cached && cached.expires > now) return cached.value;
  paths.delete(key);
  if (paths.size >= MAX_ENTRIES) paths.delete(paths.keys().next().value!);
  const value = (async () => {
    if (episode !== undefined) return (await resolveEpisodePage(slug, season!, episode)).path;
    if (season !== undefined) return (await resolveSeasonPage(slug, season)).path;
    return (await resolveSeriesPage(slug)).path;
  })().catch((error) => {
    paths.delete(key);
    // The page owns its not-found UI and HTTP status. Never retain an outage or an absence.
    if (isHTTPAccessFallbackError(error)) return null;
    throw error;
  });
  paths.set(key, { expires: now + TTL, value });
  return value;
};

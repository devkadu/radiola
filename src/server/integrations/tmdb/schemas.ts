import { z } from "zod";

const nullableText = z.string().nullable().optional().default(null);
const videoSchema = z.object({
  key: z.string(),
  site: z.string(),
  type: z.string(),
  name: z.string().default(""),
});
const castSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().default(""),
  profile_path: nullableText,
});
export const episodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  episode_number: z.number(),
  season_number: z.number(),
  overview: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  still_path: nullableText,
  air_date: nullableText,
  runtime: z.number().nullish().default(null),
  production_code: nullableText,
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  crew: z
    .array(z.object({ name: z.string(), job: z.string(), profile_path: nullableText }))
    .default([]),
  guest_stars: z.array(castSchema).default([]),
});
const seasonSummarySchema = z.object({
  id: z.number(),
  season_number: z.number(),
  name: z.string(),
  episode_count: z.number().default(0),
  overview: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  poster_path: nullableText,
  air_date: nullableText,
});
export const seasonSchema = seasonSummarySchema.omit({ episode_count: true }).extend({
  episodes: z.array(episodeSchema).default([]),
});
export const seriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string().default(""),
  overview: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  poster_path: nullableText,
  backdrop_path: nullableText,
  first_air_date: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  last_air_date: nullableText,
  number_of_episodes: z.number().default(0),
  number_of_seasons: z.number().default(0),
  vote_average: z.number().default(0),
  vote_count: z.number().default(0),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  seasons: z.array(seasonSummarySchema).default([]),
  videos: z.object({ results: z.array(videoSchema).default([]) }).default({ results: [] }),
  next_episode_to_air: episodeSchema.nullish().default(null),
  last_episode_to_air: episodeSchema.nullish().default(null),
});
export const seriesListSchema = z.object({
  results: z.array(seriesSchema),
  page: z.number().default(1),
  total_pages: z.number().default(0),
  total_results: z.number().default(0),
});
const providerSchema = z.object({
  provider_id: z.number(),
  provider_name: z.string(),
  logo_path: z.string(),
  display_priority: z.number().default(0),
});
export const watchProvidersSchema = z.object({
  results: z.record(
    z.string(),
    z.object({
      link: z.string().optional(),
      flatrate: z.array(providerSchema).default([]),
      rent: z.array(providerSchema).default([]),
      buy: z.array(providerSchema).default([]),
    }),
  ),
});
export const personSchema = z.object({
  id: z.number(),
  name: z.string(),
  biography: z.string().default(""),
  profile_path: nullableText,
  birthday: nullableText,
  place_of_birth: nullableText,
  known_for_department: z.string().default(""),
});

export const providersListSchema = z.object({ results: z.array(providerSchema) });
export const genresSchema = z.object({
  genres: z.array(z.object({ id: z.number(), name: z.string() })),
});
export const videosSchema = z.object({ results: z.array(videoSchema) });
export const creditsSchema = z.object({ cast: z.array(castSchema) });
export const personTvCreditsSchema = z.object({
  cast: z.array(seriesSchema.extend({ character: z.string().default("") })),
});

export type Series = z.infer<typeof seriesSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type Episode = z.infer<typeof episodeSchema>;

export type WatchProviders = z.infer<typeof watchProvidersSchema>;

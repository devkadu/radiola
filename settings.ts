import "server-only";
import { z } from "zod";
import { ConfigurationError } from "./src/server/config/configuration-error";

const tmdbSettingsSchema = z.object({
  BASE_URL: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  }),
  ACCESS_TOKEN: z.string().trim().min(1),
});

export const settings = {
  // Validate when the integration is used, so unrelated routes can start independently.
  get TMDB() {
    const result = tmdbSettingsSchema.safeParse({
      BASE_URL: process.env.TMDB_API_BASE_URL ?? "https://api.themoviedb.org/3",
      ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN,
    });
    if (!result.success) {
      throw new ConfigurationError(
        result.error.issues.map((issue) => `TMDB.${issue.path.join(".")}`),
      );
    }
    return result.data;
  },
};

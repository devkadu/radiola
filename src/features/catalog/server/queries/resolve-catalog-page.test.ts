import { beforeEach, expect, it, vi } from "vitest";
import { TmdbError } from "@/server/integrations/tmdb/error";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  series: vi.fn(),
  season: vi.fn(),
  episode: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
vi.mock("@/server/database/public", () => ({ supabase: { from: mocks.from } }));
vi.mock("@/server/integrations/tmdb/requests/get-series-details", () => ({
  getSeriesDetails: mocks.series,
}));
vi.mock("@/server/integrations/tmdb/requests/get-season-details", () => ({
  getSeasonDetails: mocks.season,
}));
vi.mock("@/server/integrations/tmdb/requests/get-episode-details", () => ({
  getEpisodeDetails: mocks.episode,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import { resolveEpisodePage, resolveSeasonPage, resolveSeriesPage } from "./resolve-catalog-page";

let stored: Record<string, unknown>;
let databaseError: Error | null;
beforeEach(() => {
  stored = { series: "slug-persistente-700", episodes: "episodio-1-titulo-antigo" };
  databaseError = null;
  mocks.series.mockResolvedValue({ id: 700, name: "Título novo" });
  mocks.season.mockResolvedValue({ season_number: 1, name: "Temporada 1", episodes: [] });
  mocks.episode.mockResolvedValue({ episode_number: 1, season_number: 1, name: "Nome novo" });
  mocks.from.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(),
    };
    [chain.select, chain.eq, chain.order, chain.limit].forEach((method) =>
      method.mockReturnValue(chain),
    );
    chain.maybeSingle.mockImplementation(async () => ({
      data: stored[table] ? { slug: stored[table] } : null,
      error: databaseError,
    }));
    return chain;
  });
});

it("keeps a persisted series slug when the upstream title changes", async () => {
  const page = await resolveSeriesPage("slug-persistente-700");
  expect(page.path).toBe("/series/slug-persistente-700");
});

it("resolves series aliases to their persisted canonical identity", async () => {
  await expect(resolveSeriesPage("outro-nome-700")).resolves.toMatchObject({
    path: "/series/slug-persistente-700",
  });
});

it("normalizes a season alias together with its parent series", async () => {
  await expect(resolveSeasonPage("outro-nome-700", "temporada-01")).resolves.toMatchObject({
    path: "/series/slug-persistente-700/temporada-1",
  });
});

it("keeps a persisted episode slug and normalizes the full path", async () => {
  await expect(
    resolveEpisodePage("outro-nome-700", "temporada-01", "episodio-1-outro-nome"),
  ).resolves.toMatchObject({
    path: "/series/slug-persistente-700/temporada-1/episodio-1-titulo-antigo",
  });
  await expect(
    resolveEpisodePage("slug-persistente-700", "temporada-1", "episodio-1-titulo-antigo"),
  ).resolves.toMatchObject({ episodeParam: "episodio-1-titulo-antigo" });
});

it("uses deterministic slugs for uncached or malformed catalog records", async () => {
  stored.series = "wrong-id-701";
  stored.episodes = "episodio-2-incompativel";
  await expect(
    resolveEpisodePage("titulo-novo-700", "temporada-1", "episodio-1-nome-novo"),
  ).resolves.toMatchObject({ path: "/series/titulo-novo-700/temporada-1/episodio-1-nome-novo" });
  stored.series = null;
  await expect(resolveSeriesPage("titulo-novo-700")).resolves.toMatchObject({
    slug: "titulo-novo-700",
  });
});

it("keeps canonical episode slugs valid when the upstream title is empty", async () => {
  stored.episodes = null;
  mocks.episode.mockResolvedValueOnce({ episode_number: 1, season_number: 1, name: "" });
  await expect(
    resolveEpisodePage("slug-persistente-700", "temporada-1", "episodio-1"),
  ).resolves.toMatchObject({ episodeParam: "episodio-1" });
});

it.each([
  ["invalid", "temporada-1", "episodio-1"],
  ["serie-0", "temporada-1", "episodio-1"],
  ["serie-9007199254740992", "temporada-1", "episodio-1"],
  ["serie-700", "temporada-NaN", "episodio-1"],
  ["serie-700", "temporada-1", "episodio-0"],
  ["serie-700", "temporada-1", "episodio-NaN"],
])(
  "rejects malformed catalog coordinates before integrations: %s / %s / %s",
  async (slug, season, episode) => {
    await expect(resolveEpisodePage(slug, season, episode)).rejects.toThrow("NOT_FOUND");
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.series).not.toHaveBeenCalled();
    expect(mocks.episode).not.toHaveBeenCalled();
  },
);

it("turns an upstream absence into not-found and preserves temporary outages", async () => {
  mocks.series.mockRejectedValueOnce(new TmdbError(404));
  await expect(resolveSeriesPage("slug-persistente-700")).rejects.toThrow("NOT_FOUND");
  const unavailable = new TmdbError(503);
  mocks.series.mockRejectedValueOnce(unavailable);
  await expect(resolveSeriesPage("slug-persistente-700")).rejects.toBe(unavailable);
});

it("does not invent a new canonical slug during a database outage", async () => {
  databaseError = new Error("Catalog unavailable");
  await expect(resolveSeriesPage("slug-persistente-700")).rejects.toBe(databaseError);
});

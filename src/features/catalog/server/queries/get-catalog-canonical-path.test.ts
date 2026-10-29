import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ series: vi.fn(), season: vi.fn(), episode: vi.fn() }));
vi.mock("./resolve-catalog-page", () => ({
  resolveSeriesPage: mocks.series,
  resolveSeasonPage: mocks.season,
  resolveEpisodePage: mocks.episode,
}));
let getPath: typeof import("./get-catalog-canonical-path").getCatalogCanonicalPath;
beforeEach(async () => {
  vi.resetModules();
  getPath = (await import("./get-catalog-canonical-path")).getCatalogCanonicalPath;
  mocks.series.mockResolvedValue({ path: "/series/canonica-700" });
  mocks.season.mockResolvedValue({ path: "/series/canonica-700/temporada-1" });
  mocks.episode.mockResolvedValue({ path: "/series/canonica-700/temporada-1/episodio-1-canonico" });
});

it.each([
  "/",
  "/series",
  "/series/invalid",
  "/series/serie-0",
  "/series/serie-700/temporada-NaN",
  "/series/serie-700/temporada-1/episodio-0",
  "/u/fixture",
  "/api/catalog/season",
])("does not resolve unrelated or invalid routes: %s", async (path) => {
  expect(await getPath(path)).toBeNull();
  expect(mocks.series).not.toHaveBeenCalled();
  expect(mocks.season).not.toHaveBeenCalled();
  expect(mocks.episode).not.toHaveBeenCalled();
});

it("shares a single pending lookup across different names for the same catalog identity", async () => {
  await Promise.all([
    getPath("/series/alias-700"),
    getPath("/series/outro-700"),
    getPath("/series/canonica-700"),
  ]);
  expect(mocks.series).toHaveBeenCalledTimes(1);
});

it("resolves a complete deep path before rendering", async () => {
  expect(await getPath("/series/alias-700/temporada-01/episodio-1-antigo")).toBe(
    "/series/canonica-700/temporada-1/episodio-1-canonico",
  );
  expect(mocks.episode).toHaveBeenCalledWith("alias-700", "temporada-01", "episodio-1-antigo");
});

it("expires catalog identities after an hour", async () => {
  const now = vi.spyOn(Date, "now").mockReturnValue(1);
  await getPath("/series/alias-700");
  now.mockReturnValue(3_600_002);
  await getPath("/series/alias-700");
  expect(mocks.series).toHaveBeenCalledTimes(2);
});

it("leaves missing pages to their not-found boundary and does not retain the absence", async () => {
  mocks.series.mockRejectedValueOnce(
    Object.assign(new Error("Not found"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" }),
  );
  expect(await getPath("/series/alias-700")).toBeNull();
  expect(await getPath("/series/alias-700")).toBe("/series/canonica-700");
});

it("propagates integration outages without retaining them", async () => {
  const error = new Error("Unavailable");
  mocks.series.mockRejectedValueOnce(error);
  await expect(getPath("/series/alias-700")).rejects.toBe(error);
  await expect(getPath("/series/alias-700")).resolves.toBe("/series/canonica-700");
});

it("bounds the number of retained catalog identities", async () => {
  for (let id = 1; id <= 1001; id++) await getPath(`/series/alias-${id}`);
  await getPath("/series/alias-1");
  expect(mocks.series).toHaveBeenCalledTimes(1002);
});

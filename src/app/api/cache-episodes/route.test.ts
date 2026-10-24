import { POST } from "@/app/api/cache-episodes/route";
import { AccessError } from "@/server/auth/auth";
import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  favorite: vi.fn(),
  series: vi.fn(),
  season: vi.fn(),
  cacheSeries: vi.fn(),
  cacheEpisodes: vi.fn(),
}));
vi.mock("@/server/auth/auth", async (original) => ({
  ...(await original<typeof import("@/server/auth/auth")>()),
  requireUser: mocks.requireUser,
}));
vi.mock("@/server/integrations/tmdb/requests/get-series-details", () => ({
  getSeriesDetails: mocks.series,
}));
vi.mock("@/server/integrations/tmdb/requests/get-season-details", () => ({
  getSeasonDetails: mocks.season,
}));
vi.mock("@/features/catalog/server/cache", () => ({
  cacheService: { cacheSeries: mocks.cacheSeries, cacheEpisodes: mocks.cacheEpisodes },
}));

function request(seriesId: unknown) {
  return new NextRequest("http://localhost/api/cache-episodes", {
    method: "POST",
    body: JSON.stringify({ seriesId }),
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  const query = { select: () => query, eq: () => query, maybeSingle: mocks.favorite };
  mocks.requireUser.mockResolvedValue({ user: { id: "member" }, supabase: { from: () => query } });
  mocks.favorite.mockResolvedValue({ data: { series_id: 1 }, error: null });
});
it("does not fetch metadata or write when the user is unauthenticated", async () => {
  mocks.requireUser.mockRejectedValue(new AccessError(401, "Não autorizado"));
  expect((await POST(request(1))).status).toBe(401);
  expect(mocks.series).not.toHaveBeenCalled();
  expect(mocks.cacheSeries).not.toHaveBeenCalled();
});
it.each([0, -1, 1.5, "1", true])("rejects invalid series ID %s", async (id) => {
  expect((await POST(request(id))).status).toBe(400);
  expect(mocks.series).not.toHaveBeenCalled();
});
it("does not perform privileged work for a series outside the member's favorites", async () => {
  mocks.favorite.mockResolvedValue({ data: null, error: null });
  expect((await POST(request(1))).status).toBe(403);
  expect(mocks.series).not.toHaveBeenCalled();
  expect(mocks.cacheEpisodes).not.toHaveBeenCalled();
});
it("caches only after checking the authenticated member's favorite", async () => {
  mocks.series.mockResolvedValue({ id: 1, name: "Series", seasons: [{ season_number: 1 }] });
  mocks.season.mockResolvedValue({ episodes: [{ id: 10, season_number: 1, episode_number: 1 }] });
  expect((await POST(request(1))).status).toBe(200);
  expect(mocks.cacheEpisodes).toHaveBeenCalledWith(1, [expect.objectContaining({ id: 10 })]);
});

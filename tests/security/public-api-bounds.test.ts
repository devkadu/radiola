import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  getEpisodeDetails: vi.fn(),
  getSeriesDetails: vi.fn(),
  searchCache: vi.fn(),
  searchSeries: vi.fn(),
  getSmartAnswer: vi.fn(),
  discoverSeries: vi.fn(),
}));
vi.mock("@/server/database/admin", () => ({ supabaseAdmin: { rpc: mocks.rpc } }));
vi.mock("@/server/integrations/tmdb/requests/get-episode-details", () => ({
  getEpisodeDetails: mocks.getEpisodeDetails,
}));
vi.mock("@/server/integrations/tmdb/requests/get-series-details", () => ({
  getSeriesDetails: mocks.getSeriesDetails,
}));
vi.mock("@/features/catalog/server/cache", () => ({ cacheService: { search: mocks.searchCache } }));
vi.mock("@/server/integrations/tmdb/requests/search-series", () => ({
  searchSeries: mocks.searchSeries,
}));
vi.mock("@/features/search/server/queries/get-smart-answer", () => ({
  getSmartAnswer: mocks.getSmartAnswer,
}));
vi.mock("@/server/integrations/tmdb/requests/discover-series", () => ({
  discoverSeries: mocks.discoverSeries,
}));

import { GET as episodeFeed } from "@/app/api/my-series-episodes/route";
import { GET as search } from "@/app/api/search/route";
import { GET as smartSearch } from "@/app/api/smart-search/route";
import { GET as discover } from "@/app/api/discover/route";

const request = (path: string, name: string, value: string) => {
  const url = new URL(`https://example.test${path}`);
  url.searchParams.set(name, value);
  return new NextRequest(url);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  mocks.searchCache.mockResolvedValue({ series: [], episodes: [] });
  mocks.searchSeries.mockResolvedValue({ results: [] });
  mocks.getSmartAnswer.mockResolvedValue(null);
  mocks.discoverSeries.mockResolvedValue({ results: [], page: 1, total_pages: 1 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("public API work limits", () => {
  it.each([
    ["page", "1.5"],
    ["page", "501"],
    ["page", "0"],
    ["genreId", "NaN"],
    ["providerId", "-1"],
    ["sortBy", "arbitrary"],
  ])("rejects unsupported discovery filters before contacting TMDB: %s=%s", async (key, value) => {
    const response = await discover(request("/api/discover", key, value));
    expect(response.status).toBe(400);
    expect(mocks.discoverSeries).not.toHaveBeenCalled();
  });

  it("preserves supported discovery filters and public caching", async () => {
    const response = await discover(
      new NextRequest(
        "https://example.test/api/discover?page=500&genreId=18&providerId=8&sortBy=vote_average.desc",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.discoverSeries).toHaveBeenCalledWith({
      page: 500,
      genreId: 18,
      providerId: 8,
      sortBy: "vote_average.desc",
    });
    expect(response.headers.get("cache-control")).toContain("public");
  });

  it("keeps default discovery available without filters", async () => {
    const response = await discover(new NextRequest("https://example.test/api/discover"));
    expect(response.status).toBe(200);
    expect(mocks.discoverSeries).toHaveBeenCalledWith({
      page: 1,
      genreId: null,
      providerId: null,
      sortBy: "popularity.desc",
    });
  });

  it.each(["0", "-1", "1.5", "NaN", "Infinity", "1,,2", "2147483648", "1e3"])(
    "rejects malformed IDs before consulting the database: %s",
    async (ids) => {
      const response = await episodeFeed(request("/api/my-series-episodes", "ids", ids));
      expect(response.status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );

  it("rejects more than 1000 submitted IDs before consulting the database", async () => {
    const response = await episodeFeed(
      request("/api/my-series-episodes", "ids", Array(1001).fill("1").join(",")),
    );
    expect(response.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("deduplicates IDs and caches a successful public result", async () => {
    const response = await episodeFeed(request("/api/my-series-episodes", "ids", "1,2,1"));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("hot_episodes_by_series", { series_ids: [1, 2] });
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
  });

  it("limits enrichment to 20 episodes and four simultaneous catalog requests", async () => {
    mocks.rpc.mockResolvedValue({
      data: Array.from({ length: 50 }, (_, i) => ({
        episode_id: `700-s1-e${i + 1}`,
        comment_count: 50 - i,
      })),
      error: null,
    });
    let active = 0;
    let peak = 0;
    const lookup = async (result: object) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return result;
    };
    mocks.getEpisodeDetails.mockImplementation(() => lookup({ name: "Episódio" }));
    mocks.getSeriesDetails.mockImplementation(() => lookup({ id: 700, name: "Série" }));
    const response = await episodeFeed(request("/api/my-series-episodes", "ids", "700"));
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveLength(20);
    expect(mocks.getEpisodeDetails).toHaveBeenCalledTimes(20);
    expect(mocks.getSeriesDetails).toHaveBeenCalledTimes(20);
    expect(peak).toBeLessThanOrEqual(4);
  });

  it("does not turn a database failure into a cacheable empty success", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("Database unavailable") });
    const response = await episodeFeed(request("/api/my-series-episodes", "ids", "700"));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control") ?? "").not.toContain("public");
  });

  it.each([
    ["/api/search", search],
    ["/api/smart-search", smartSearch],
  ] as const)(
    "rejects an oversized query before calling any integration: %s",
    async (path, handler) => {
      const response = await handler(request(path, "q", "x".repeat(201)));
      expect(response.status).toBe(400);
      expect(mocks.searchCache).not.toHaveBeenCalled();
      expect(mocks.searchSeries).not.toHaveBeenCalled();
      expect(mocks.getSmartAnswer).not.toHaveBeenCalled();
    },
  );

  it("preserves normal search queries at the supported boundary", async () => {
    const q = "x".repeat(200);
    const response = await search(request("/api/search", "q", ` ${q} `));
    expect(response.status).toBe(200);
    expect(mocks.searchCache).toHaveBeenCalledWith(q);
    expect(mocks.searchSeries).toHaveBeenCalledWith(q);
  });
});

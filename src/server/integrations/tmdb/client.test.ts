import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { tmdbRequest } from "./client";
import { TmdbError } from "./error";
import { getSeriesDetails } from "./requests/get-series-details";
import { getSeasonDetails } from "./requests/get-season-details";
import { searchSeries } from "./requests/search-series";
import { getWatchProvidersList } from "./requests/get-watch-providers-list";

const schema = z.object({ id: z.number() });
beforeEach(() => {
  vi.stubEnv("TMDB_API_BASE_URL", "https://catalog.example.test/3/");
  vi.stubEnv("TMDB_ACCESS_TOKEN", "test-private-token");
});
afterEach(() => vi.unstubAllEnvs());

it("preserves the API base path, keeps the token in headers and forwards Next cache options", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ id: 42, name: "Fixture" }));
  const result = await getSeriesDetails("42");
  const [input, options] = vi.mocked(fetch).mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/3/tv/42");
  expect(url.searchParams.get("append_to_response")).toBe("videos");
  expect(url.searchParams.get("language")).toBe("pt-BR");
  expect(url.href).not.toContain("test-private-token");
  expect(options).toMatchObject({
    headers: { Authorization: "Bearer test-private-token" },
    next: { revalidate: 3600 },
  });
  expect(options?.signal).toBeInstanceOf(AbortSignal);
  expect(result.name).toBe("Fixture");
});

it("encodes path segments instead of allowing an ID to inject a query", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json({ id: 4, season_number: 2, name: "Season", episodes: [] }),
  );
  await getSeasonDetails("42?api_key=wrong", 2);
  const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]));
  expect(url.pathname).toBe("/3/tv/42%3Fapi_key%3Dwrong/season/2");
  expect(url.searchParams.has("api_key")).toBe(false);
});

it("encodes search text and preserves the short search cache", async () => {
  vi.mocked(fetch).mockResolvedValue(Response.json({ results: [] }));
  await searchSeries("ação & drama?", 3);
  const [input, options] = vi.mocked(fetch).mock.calls[0];
  const url = new URL(String(input));
  expect(url.searchParams.get("query")).toBe("ação & drama?");
  expect(url.searchParams.get("page")).toBe("3");
  expect(options).toMatchObject({ next: { revalidate: 300 } });
});

it.each([401, 404, 429, 502])(
  "rejects HTTP %s without returning an empty success",
  async (status) => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ message: "provider detail" }, { status, headers: { "Retry-After": "15" } }),
    );
    await expect(getWatchProvidersList()).rejects.toMatchObject({
      status,
      code: "HTTP_ERROR",
      retryAfter: "15",
    });
  },
);

it.each(["<html>gateway error</html>", '{"id":"wrong-type"}'])(
  "rejects malformed successful responses",
  async (body) => {
    vi.mocked(fetch).mockResolvedValue(new Response(body, { status: 200 }));
    await expect(tmdbRequest("/tv/42", { schema })).rejects.toMatchObject({
      status: 502,
      code: "INVALID_RESPONSE",
    });
  },
);

it("distinguishes a timeout from a network failure", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
  await expect(tmdbRequest("/tv/42", { schema })).rejects.toMatchObject({
    status: 504,
    code: "TIMEOUT",
  });
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));
  await expect(tmdbRequest("/tv/42", { schema })).rejects.toMatchObject({
    status: 502,
    code: "NETWORK_ERROR",
  });
});

it("preserves caller cancellation instead of disguising it as an upstream failure", async () => {
  const controller = new AbortController();
  controller.abort();
  const cause = new DOMException("cancelled", "AbortError");
  vi.mocked(fetch).mockRejectedValue(cause);
  await expect(tmdbRequest("/tv/42", { schema, signal: controller.signal })).rejects.toBe(cause);
  expect(cause).not.toBeInstanceOf(TmdbError);
});

it("also detects a timeout while reading the response body", async () => {
  const response = Response.json({ id: 42 });
  vi.spyOn(response, "json").mockRejectedValue(new DOMException("timed out", "TimeoutError"));
  vi.mocked(fetch).mockResolvedValue(response);
  await expect(tmdbRequest("/tv/42", { schema })).rejects.toMatchObject({
    status: 504,
    code: "TIMEOUT",
  });
});

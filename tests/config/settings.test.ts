import { afterEach, expect, it, vi } from "vitest";
import { settings } from "@settings";
import { ConfigurationError } from "@/server/config/configuration-error";

afterEach(() => vi.unstubAllEnvs());

it("reads validated settings when used, including a changed test environment", () => {
  vi.stubEnv("TMDB_API_BASE_URL", "http://127.0.0.1:15432/3");
  vi.stubEnv("TMDB_ACCESS_TOKEN", "test-private-token");
  expect(settings.TMDB.BASE_URL).toBe("http://127.0.0.1:15432/3");
  vi.stubEnv("TMDB_API_BASE_URL", "https://catalog.example.test/v3");
  expect(settings.TMDB.BASE_URL).toBe("https://catalog.example.test/v3");
});

it("rejects missing credentials and reports only field names", () => {
  vi.stubEnv("TMDB_API_BASE_URL", "not-a-url-with-sensitive-information");
  vi.stubEnv("TMDB_ACCESS_TOKEN", "");
  try {
    void settings.TMDB;
    throw new Error("Expected configuration error");
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigurationError);
    expect((error as Error).message).toContain("TMDB.BASE_URL");
    expect((error as Error).message).toContain("TMDB.ACCESS_TOKEN");
    expect((error as Error).message).not.toContain("sensitive-information");
  }
});

it.each(["ftp://catalog.example.test/3", "https://catalog.example.test/3?key=private"])(
  "rejects an unsupported base URL without exposing it",
  (url) => {
    vi.stubEnv("TMDB_API_BASE_URL", url);
    vi.stubEnv("TMDB_ACCESS_TOKEN", "test-private-token");
    expect(() => settings.TMDB).toThrow(ConfigurationError);
  },
);

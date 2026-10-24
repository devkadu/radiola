import { expect, it, vi } from "vitest";
import { TmdbError } from "@/server/integrations/tmdb/error";
import { apiError } from "./api-error";

it.each([
  [new TmdbError(404), 404],
  [new TmdbError(401), 502],
  [new TmdbError(403), 502],
  [new TmdbError(504, "TIMEOUT"), 504],
  [new TmdbError(429, "HTTP_ERROR", undefined, "10"), 429],
] as const)("maps provider errors to a safe public response (%s)", async (error, status) => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const response = apiError(error, "catalog.test");
  expect(response.status).toBe(status);
  expect(await response.json()).toMatchObject({
    code: error.code,
    requestId: expect.any(String),
    error: expect.any(String),
  });
  expect(response.headers.get("Retry-After")).toBe(error.retryAfter ?? null);
});

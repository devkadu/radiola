import { expect, it } from "vitest";
import { resolveSiteUrl } from "./site";

it.each([
  undefined,
  "",
  "   ",
  "segundatemporada.com.br",
  "http://segundatemporada.com.br/",
  "https://www.segundatemporada.com.br/path?x=1",
  "https://segundatemporada.com",
  "www.segundatemporada.com",
])("uses the production canonical origin for %s", (value) => {
  expect(resolveSiteUrl(value)).toBe("https://www.segundatemporada.com.br");
});

it.each([
  ["http://127.0.0.1:3030/path?test=1", "http://127.0.0.1:3030"],
  ["http://localhost:3000/", "http://localhost:3000"],
  ["https://preview.example.test/base", "https://preview.example.test"],
])("preserves explicitly configured development and custom origins: %s", (value, origin) => {
  expect(resolveSiteUrl(value)).toBe(origin);
});

it("rejects unsupported schemes", () => {
  expect(() => resolveSiteUrl("ftp://example.test")).toThrow("Invalid site URL protocol");
});

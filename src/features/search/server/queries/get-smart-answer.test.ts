import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/server/database/public", () => ({ supabase: { from: mocks.from } }));

import { GET } from "@/app/api/smart-search/route";

const query = (result: { data: unknown; error: unknown }) => {
  const chain = {
    select: vi.fn(),
    contains: vi.fn(),
    ilike: vi.fn(),
    limit: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [chain.select, chain.contains, chain.ilike, chain.limit, chain.in]) {
    method.mockReturnValue(chain);
  }
  return chain;
};
const request = (q: string) =>
  new NextRequest(`https://example.test/api/smart-search?q=${encodeURIComponent(q)}`);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockImplementation(() => {
    throw new Error("Unexpected database query");
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("smart search database failures", () => {
  it.each(["série de comédia", "quando volta Fixture"])(
    "does not cache a context failure as no answer: %s",
    async (q) => {
      mocks.from.mockReturnValue(
        query({ data: null, error: { message: "Private database detail" } }),
      );
      const response = await GET(request(q));
      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control") ?? "").not.toContain("public");
      expect(await response.text()).not.toContain("Private database detail");
      expect(mocks.from).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["série de comédia", [{ series_id: 700, series_name: "Fixture" }]],
    ["parecidas com Fixture", { series_name: "Fixture", similares_nomes: ["Outra"] }],
  ])("does not cache failed series enrichment: %s", async (q, data) => {
    mocks.from
      .mockReturnValueOnce(query({ data, error: null }))
      .mockReturnValueOnce(query({ data: null, error: new Error("Unavailable") }));
    const response = await GET(request(q as string));
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control") ?? "").not.toContain("public");
  });

  it("returns a cacheable absent answer when no context actually exists", async () => {
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    const response = await GET(request("quando volta Fixture"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ smartAnswer: null });
    expect(response.headers.get("cache-control")).toContain("public");
  });
});

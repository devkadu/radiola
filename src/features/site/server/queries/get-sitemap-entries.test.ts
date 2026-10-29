import { beforeEach, expect, it, vi } from "vitest";
import { SITE_URL } from "@/shared/constants/site";

const mocks = vi.hoisted(() => ({ publicFrom: vi.fn(), adminFrom: vi.fn() }));
vi.mock("@/server/database/public", () => ({ supabase: { from: mocks.publicFrom } }));
vi.mock("@/server/database/admin", () => ({ supabaseAdmin: { from: mocks.adminFrom } }));
import { getSitemapEntries } from "./get-sitemap-entries";

const series = [
  { id: 700, slug: "slug-persistente-700" },
  { id: 701, slug: null },
  { id: 702, slug: "id-errado-703" },
  { id: 704, slug: "../fora-704" },
];
const episodes = [
  { series_id: 700, season_number: 1, episode_number: 1, slug: "episodio-1-piloto" },
  { series_id: 700, season_number: 1, episode_number: 2, slug: "episodio-2-segundo" },
  { series_id: 700, season_number: 1, episode_number: 2, slug: "episodio-2-segundo" },
  { series_id: 701, season_number: 1, episode_number: 1, slug: "episodio-1-piloto" },
  { series_id: 700, season_number: -1, episode_number: 1, slug: "episodio-1-piloto" },
  { series_id: 700, season_number: 1, episode_number: 0, slug: "episodio-0-invalido" },
  { series_id: 700, season_number: 1, episode_number: 3, slug: "episodio-4-incompativel" },
];
let chains: Record<string, ReturnType<typeof makeChain>>;
let failure: string | null;
const makeChain = (table: string, rows: unknown[]) => {
  const chain = { select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), range: vi.fn() };
  [chain.select, chain.eq, chain.not, chain.order].forEach((method) =>
    method.mockReturnValue(chain),
  );
  chain.range.mockImplementation(async (from: number, to: number) => ({
    data: rows.slice(from, to + 1),
    error: failure === table ? new Error("Query failed") : null,
  }));
  return chain;
};
beforeEach(() => {
  failure = null;
  chains = {
    series: makeChain("series", series),
    episodes: makeChain("episodes", episodes),
    articles: makeChain("articles", [
      {
        slug: "artigo-publicado",
        published_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-02T00:00:00Z",
      },
      { slug: "sem-atualizacao", published_at: "2025-01-01T00:00:00Z", updated_at: null },
      { slug: "data-invalida", published_at: null, updated_at: "not-a-date" },
      { slug: "data-futura", published_at: null, updated_at: "9999-01-01T00:00:00Z" },
      { slug: "invalid/path", published_at: null, updated_at: null },
    ]),
  };
  mocks.publicFrom.mockImplementation((table: string) => chains[table]);
  mocks.adminFrom.mockImplementation((table: string) => chains[table]);
});

it("includes public hubs, all ranking pages and known canonical seasons without duplicate URLs", async () => {
  const entries = await getSitemapEntries();
  const urls = entries.map((entry) => entry.url);
  expect(urls).toContain(`${SITE_URL}/comunidade`);
  expect(urls).toContain(`${SITE_URL}/melhores/netflix`);
  expect(urls.filter((url) => url.includes("/melhores/"))).toHaveLength(8);
  expect(urls).toContain(`${SITE_URL}/series/slug-persistente-700/temporada-1`);
  expect(urls).toContain(`${SITE_URL}/series/slug-persistente-700/temporada-1/episodio-2-segundo`);
  expect(new Set(urls).size).toBe(urls.length);
  expect(
    urls.some((url) => /id-errado|incompativel|invalido|invalid\/path|\/null|fora-704/.test(url)),
  ).toBe(false);
  expect(urls.some((url) => /\/u\/|\/perfil|\/admin|\/busca/.test(url))).toBe(false);
});

it("reads only published article URLs and uses real stored timestamps", async () => {
  const entries = await getSitemapEntries();
  expect(chains.articles.eq).toHaveBeenCalledWith("status", "published");
  expect(chains.articles.select).toHaveBeenCalledWith("slug, published_at, updated_at");
  expect(entries.find((entry) => entry.url.endsWith("/artigo-publicado"))?.lastModified).toBe(
    "2025-01-02T00:00:00.000Z",
  );
  expect(entries.find((entry) => entry.url.endsWith("/sem-atualizacao"))?.lastModified).toBe(
    "2025-01-01T00:00:00.000Z",
  );
  expect(
    entries.find((entry) => entry.url.endsWith("/data-invalida"))?.lastModified,
  ).toBeUndefined();
  expect(entries.find((entry) => entry.url.endsWith("/data-futura"))?.lastModified).toBeUndefined();
  expect(entries.find((entry) => entry.url === `${SITE_URL}/`)?.lastModified).toBeUndefined();
});

it("does not cache a partial sitemap as a successful result during an integration failure", async () => {
  failure = "articles";
  await expect(getSitemapEntries()).rejects.toThrow("Query failed");
});

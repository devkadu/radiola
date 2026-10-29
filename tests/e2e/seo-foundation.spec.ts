import { expect, test } from "@playwright/test";

test.use({ userAgent: "facebookexternalhit/1.1" });
const base = "http://127.0.0.1:3030";
const readTags = (html: string, element: "meta" | "link") =>
  Array.from(html.matchAll(new RegExp(`<${element}\\s[^>]*>`, "gi")), ([tag]) =>
    Object.fromEntries(
      Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [
        key,
        value.replaceAll("&amp;", "&"),
      ]),
    ),
  );

test("catalog aliases redirect in one permanent hop to the stored canonical path", async ({
  request,
}) => {
  const cases = [
    ["/series/qualquer-nome-700?season=1&ref=seo", "/series/serie-de-teste-700?season=1&ref=seo"],
    ["/series/qualquer-nome-700/temporada-01", "/series/serie-de-teste-700/temporada-1"],
    [
      "/series/qualquer-nome-700/temporada-01/episodio-1-piloto",
      "/series/serie-de-teste-700/temporada-1/episodio-1-o-comeco",
    ],
  ];
  for (const userAgent of [
    "facebookexternalhit/1.1",
    "Googlebot",
    "Mozilla/5.0 Chrome/150.0.0.0 Safari/537.36",
  ]) {
    for (const [alias, target] of cases) {
      const response = await request.get(alias, {
        maxRedirects: 0,
        headers: { "User-Agent": userAgent },
      });
      expect(response.status()).toBe(308);
      expect(new URL(response.headers().location, base).href).toBe(`${base}${target}`);
      const page = await request.get(target, { maxRedirects: 0 });
      expect(page.status()).toBe(200);
      const canonical = readTags(await page.text(), "link").find(
        (tag) => tag.rel === "canonical",
      )?.href;
      expect(canonical).toBe(`${base}${target.split("?")[0]}`);
    }
  }
});

test("canonical catalog pages stay cached and invalid coordinates are not indexable", async ({
  request,
}) => {
  const path = "/series/serie-de-teste-700";
  await request.get(path);
  const catalogReads = async () => {
    const history: { pathname: string }[] = await (
      await request.get("http://127.0.0.1:15432/__fixture__/requests")
    ).json();
    return history.filter(
      (call) => call.pathname === "/rest/v1/series" || call.pathname.endsWith("/tv/700"),
    ).length;
  };
  const reads = await catalogReads();
  const cached = await request.get(path);
  expect(cached.headers()["x-nextjs-cache"]).toBe("HIT");
  expect(await catalogReads()).toBe(reads);
  for (const invalid of [
    "/series/invalid",
    "/series/serie-0",
    "/series/serie-de-teste-700/temporada-NaN/episodio-1-piloto",
  ]) {
    const response = await request.get(invalid);
    expect(response.status()).toBe(404);
    expect(
      readTags(await response.text(), "meta").some(
        (tag) => tag.name === "robots" && tag.content.includes("noindex"),
      ),
    ).toBe(true);
  }
});

test("private and missing profiles cannot be indexed or expose activity", async ({ request }) => {
  const missing = await request.get("/u/missing-profile");
  expect(missing.status()).toBe(404);
  expect(
    readTags(await missing.text(), "meta").some(
      (tag) => tag.name === "robots" && tag.content.includes("noindex"),
    ),
  ).toBe(true);
  const privateProfile = await request.get("/u/fixture-private");
  const privateHtml = await privateProfile.text();
  expect(privateHtml).toContain("Perfil privado");
  expect(
    readTags(privateHtml, "meta").some(
      (tag) => tag.name === "robots" && tag.content.includes("noindex"),
    ),
  ).toBe(true);
  expect(privateHtml).not.toContain("private@example.test");
  const publicProfile = await request.get("/u/fixture");
  const publicHtml = await publicProfile.text();
  expect(publicProfile.status()).toBe(200);
  expect(readTags(publicHtml, "meta").find((tag) => tag.name === "robots")?.content).toContain(
    "index, follow",
  );
  expect(readTags(publicHtml, "link").find((tag) => tag.rel === "canonical")?.href).toBe(
    `${base}/u/fixture`,
  );
  expect(publicHtml).toMatch(/<h1\b[^>]*>fixture<\/h1>/);
});

test("sitemap discovers only public canonical pages and reports stored article dates", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g), (match) => match[1]);
  expect(urls).toContain(`${base}/comunidade`);
  expect(urls).toContain(`${base}/melhores/netflix`);
  expect(urls).toContain(`${base}/series/serie-de-teste-700/temporada-1`);
  expect(urls).toContain(
    `${base}/series/serie-de-teste-700/temporada-1/episodio-2-proximo-capitulo`,
  );
  expect(urls).toContain(`${base}/artigos/artigo-publicado`);
  expect(xml).toContain("2025-01-02T00:00:00.000Z");
  expect(xml).not.toContain("artigo-rascunho");
  expect(xml).not.toContain("/u/");
  expect(new Set(urls).size).toBe(urls.length);
  for (const url of urls) {
    const page = await request.get(url, { maxRedirects: 0 });
    expect(page.status(), url).toBe(200);
    const canonical = readTags(await page.text(), "link").find(
      (tag) => tag.rel === "canonical",
    )?.href;
    expect(new URL(canonical!).href, url).toBe(new URL(url).href);
  }
});

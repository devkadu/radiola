import { expect, test } from "@playwright/test";

for (const userAgent of ["WhatsApp/2.26.1", "facebookexternalhit/1.1", "Twitterbot/1.0"]) {
  test(`delivers a complete link preview to ${userAgent} without JavaScript or authentication`, async ({
    request,
  }) => {
    const headers = { "User-Agent": userAgent };
    const response = await request.get("/", { headers });
    expect(response.status()).toBe(200);
    const html = await response.text();
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
    const tags = Array.from(head.matchAll(/<meta\s[^>]*>/gi), ([tag]) =>
      Object.fromEntries(
        Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [
          key,
          value.replaceAll("&amp;", "&"),
        ]),
      ),
    );
    const property = (name: string) => tags.find((tag) => tag.property === name)?.content;
    const twitter = (name: string) => tags.find((tag) => tag.name === `twitter:${name}`)?.content;

    expect(property("og:title")).toBe("Segunda Temporada — A conversa começa aqui.");
    expect(property("og:description")).toContain("No seu ritmo, no seu nível de spoiler.");
    expect(property("og:site_name")).toBe("Segunda Temporada");
    expect(new URL(property("og:url")!).href).toBe("http://127.0.0.1:3030/");
    expect(twitter("card")).toBe("summary_large_image");
    expect(twitter("title")).toBe(property("og:title"));

    for (const imageUrl of [property("og:image"), twitter("image")]) {
      expect(imageUrl).toBeTruthy();
      const url = new URL(imageUrl!);
      expect(url.origin).toBe("http://127.0.0.1:3030");
      expect(url.pathname).toBe("/opengraph-image");
      const image = await request.get(imageUrl!, { headers });
      expect(image.status()).toBe(200);
      expect(image.headers()["content-type"]).toContain("image/png");
      const buffer = await image.body();
      expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(buffer.readUInt32BE(16)).toBe(1200);
      expect(buffer.readUInt32BE(20)).toBe(630);
      expect(buffer.length).toBeLessThan(1_000_000);
    }
  });
}

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import Image from "@/shared/components/image/image";
import { tmdbImageUrl } from "./tmdb-image";

it("serves responsive posters directly from the source CDN without exceeding the chosen source", () => {
  const html = renderToStaticMarkup(
    <Image src="https://image.tmdb.org/t/p/w342/poster.jpg" alt="Poster" fill sizes="150px" />,
  );
  expect(html).not.toContain("/_next/image");
  expect(html).toContain("srcSet=");
  expect(html).toContain("/t/p/w154/poster.jpg");
  expect(html).toContain("/t/p/w342/poster.jpg");
  expect(html).not.toContain("/t/p/original/");
  expect(html).toContain('loading="lazy"');
});

it("uses valid presets for portraits, stills, backdrops and logos", () => {
  expect(
    tmdbImageUrl({ src: "https://image.tmdb.org/t/p/w185/actor.jpg", width: 96 }, "profile"),
  ).toContain("/w185/actor.jpg");
  expect(
    tmdbImageUrl({ src: "https://image.tmdb.org/t/p/w300/episode.jpg", width: 128 }, "still"),
  ).toContain("/w185/episode.jpg");
  expect(
    tmdbImageUrl(
      { src: "https://image.tmdb.org/t/p/original/backdrop.jpg", width: 900 },
      "backdrop",
    ),
  ).toContain("/w1280/backdrop.jpg");
  expect(
    tmdbImageUrl({ src: "https://image.tmdb.org/t/p/original/logo.png", width: 32 }, "logo"),
  ).toContain("/w45/logo.png");
});

it("preserves SVGs and does not rewrite other origins", () => {
  for (const src of [
    "https://image.tmdb.org/t/p/original/logo.svg",
    "https://example.test/avatar.jpg",
    "https://image.tmdb.org.example.test/t/p/w342/fake.jpg",
  ]) {
    expect(tmdbImageUrl({ src, width: 100 }, "poster")).toBe(src);
  }
});

it("keeps Next image processing for avatars from other providers", () => {
  const html = renderToStaticMarkup(
    <Image
      src="https://lh3.googleusercontent.com/avatar.jpg"
      alt="Avatar"
      width={48}
      height={48}
    />,
  );
  expect(html).toContain("/_next/image");
  expect(html).not.toContain("tmdbKind");
});

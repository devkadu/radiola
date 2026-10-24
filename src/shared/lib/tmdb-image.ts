import type { ImageLoaderProps } from "next/image";

export type TmdbImageKind = "poster" | "backdrop" | "still" | "profile" | "logo";

// TMDB's CDN provides these variants; do not resize the same asset again in Next.
const widths: Record<TmdbImageKind, readonly number[]> = {
  poster: [92, 154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  still: [92, 185, 300],
  profile: [45, 185],
  logo: [45, 92, 154, 185, 300, 500],
};

export function isTmdbImage(src: unknown): src is string {
  return (
    typeof src === "string" &&
    /^https:\/\/image\.tmdb\.org\/t\/p\/(?:w\d+|h\d+|original)\//.test(src)
  );
}

export function tmdbImageUrl({ src, width }: ImageLoaderProps, kind: TmdbImageKind): string {
  if (!isTmdbImage(src) || /\.svg(?:\?|$)/i.test(src)) return src;
  const url = new URL(src);
  const preset = url.pathname.split("/")[3];
  // Existing callers deliberately choose a source resolution. Keep that ceiling
  // even if a missing `sizes` would otherwise request a full viewport image.
  const ceiling = /^w\d+$/.test(preset) ? Number(preset.slice(1)) : Infinity;
  const target = Math.min(width, ceiling);
  const size = widths[kind].find((candidate) => candidate >= target);
  url.pathname = url.pathname.replace(/^(\/t\/p\/)[^/]+\//, `$1${size ? `w${size}` : "original"}/`);
  return url.href;
}

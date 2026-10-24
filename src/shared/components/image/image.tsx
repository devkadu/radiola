"use client";

import { isTmdbImage, tmdbImageUrl, type TmdbImageKind } from "@/shared/lib/tmdb-image";
import NextImage, { type ImageProps } from "next/image";

type Props = ImageProps & { tmdbKind?: TmdbImageKind };

export default function Image({ tmdbKind = "poster", ...props }: Props) {
  if (isTmdbImage(props.src) && !props.loader) {
    const source = props.src;
    if (props.unoptimized || /\.svg(?:\?|$)/i.test(source))
      return <NextImage {...props} unoptimized />;
    // The asset identity is independent of its CDN resolution. The loader owns
    // the full delivery URL, including the source resolution chosen by callers.
    const asset = new URL(source).pathname.replace(/^\/t\/p\/[^/]+/, "");
    return (
      <NextImage
        {...props}
        src={asset}
        loader={(options) => tmdbImageUrl({ ...options, src: source }, tmdbKind)}
      />
    );
  }
  return <NextImage {...props} />;
}

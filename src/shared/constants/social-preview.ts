import type { Metadata } from "next";

const title = "Segunda Temporada — A conversa começa aqui.";
const description =
  "Teorias, recomendações e debates sobre suas séries favoritas. No seu ritmo, no seu nível de spoiler.";
const image = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Segunda Temporada — Acabou o episódio. A conversa começa aqui.",
};

export const socialPreviewMetadata = {
  openGraph: {
    siteName: "Segunda Temporada",
    locale: "pt_BR",
    type: "website",
    title,
    description,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
} satisfies Pick<Metadata, "openGraph" | "twitter">;

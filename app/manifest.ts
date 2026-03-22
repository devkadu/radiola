import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Segunda Temporada",
    short_name: "2ª Temporada",
    description: "onde a sua série continua",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0E0C",
    theme_color: "#0F0E0C",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}

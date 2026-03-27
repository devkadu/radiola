import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  experimental: {
    // Mantém segmentos de página no router cache do cliente
    // evitando re-fetch ao navegar de volta para uma página visitada
    staleTimes: {
      dynamic: 30,   // páginas dinâmicas: 30s
      static: 300,   // páginas estáticas: 5min
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
    // TMDB já serve imagens otimizadas por tamanho (w92, w185, w342, etc.)
    // Não precisamos gastar transformações da Vercel re-otimizando
    unoptimized: true,
  },
};

export default nextConfig;

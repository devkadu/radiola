import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.youtube.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://image.tmdb.org https://*.supabase.co https://lh3.googleusercontent.com https://i.ytimg.com",
      "media-src 'self'",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "connect-src 'self' https://*.supabase.co https://api.themoviedb.org https://www.google-analytics.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["react-markdown"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/perfil", "/api/", "/login", "/criar-conta"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

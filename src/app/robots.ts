import type { MetadataRoute } from "next";
import { blockedBotAgents } from "@/server/security/bot-policy";

const robots = (): MetadataRoute.Robots => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/perfil", "/admin", "/api/", "/login", "/criar-conta"],
      },
      { userAgent: blockedBotAgents, disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
};

export default robots;

import { SITE_URL as siteUrl } from "@/shared/constants/site";
import type { MetadataRoute } from "next";
import { blockedBotAgents } from "@/server/security/bot-policy";

const robots = (): MetadataRoute.Robots => {
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

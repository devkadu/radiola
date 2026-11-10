import type { BeforeSendEvent } from "@vercel/analytics/next";
import { SITE_URL } from "@/shared/constants/site";

const publicPages = new Set([
  "/", "/series", "/busca", "/comunidade", "/debates", "/em-breve",
  "/mapa", "/links", "/privacidade", "/cookies", "/termos",
]);

// Only catalog/editorial paths may include public resource identifiers.
const publicResourcePath = /^\/(?:series\/[a-z0-9-]+(?:\/temporada-\d+(?:\/episodio-\d+(?:-[a-z0-9-]+)?)?)?|pessoa\/\d+|artigos\/[a-z0-9-]+|melhores\/[a-z0-9-]+)\/?$/;

export const filterAnalyticsEvent = (event: BeforeSendEvent): BeforeSendEvent | null => {
  if (event.type !== "pageview") return null;

  try {
    const url = new URL(event.url);
    if (url.origin !== SITE_URL || url.username || url.password) return null;
    if (!publicPages.has(url.pathname) && !publicResourcePath.test(url.pathname)) return null;

    // Searches, OAuth codes, campaign values and fragments never enter the report.
    return { type: "pageview", url: `${url.origin}${url.pathname}` };
  } catch {
    return null;
  }
};

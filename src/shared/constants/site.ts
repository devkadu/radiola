const PRODUCTION_ORIGIN = "https://www.segundatemporada.com.br";
const productionHosts = new Set([
  "segundatemporada.com.br",
  "www.segundatemporada.com.br",
  "segundatemporada.com",
  "www.segundatemporada.com",
]);

export const resolveSiteUrl = (value?: string): string => {
  const input = value?.trim() || PRODUCTION_ORIGIN;
  const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid site URL protocol");
  if (productionHosts.has(url.hostname)) return PRODUCTION_ORIGIN;
  return url.origin;
};

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

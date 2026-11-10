import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/shared/constants/site";
import { filterAnalyticsEvent } from "./filter-analytics-event";

describe("public audience measurement", () => {
  it.each([
    "/", "/busca", "/comunidade", "/series/breaking-bad-1396",
    "/series/breaking-bad-1396/temporada-1", "/series/breaking-bad-1396/temporada-1/episodio-2",
    "/series/serie-de-teste-700/temporada-1/episodio-1-o-comeco", "/pessoa/123", "/artigos/estreias-da-semana",
    "/melhores/netflix", "/privacidade",
  ])("keeps public page %s without queries or fragments", (path) => {
    expect(filterAnalyticsEvent({
      type: "pageview", url: `${SITE_URL}${path}?q=email%40example.com&code=secret#token`,
    })).toEqual({ type: "pageview", url: `${SITE_URL}${path}` });
  });

  it.each([
    "/perfil", "/perfil/configuracoes", "/login", "/criar-conta", "/auth/callback",
    "/admin", "/admin/artigos/123", "/u/nome-publico", "/sugestoes", "/api/profile/settings",
    "/pagina-desconhecida", "/series/email%40example.com", "/series/slug/conta/secret",
  ])("drops private, unknown or invalid page %s", (path) => {
    expect(filterAnalyticsEvent({ type: "pageview", url: `${SITE_URL}${path}` })).toBeNull();
  });

  it.each(["invalid url", "javascript:alert(1)", "https://outro-site.example/", "/series"])(
    "rejects malformed or foreign URL %s", (url) => {
      expect(filterAnalyticsEvent({ type: "pageview", url })).toBeNull();
    },
  );

  it("rejects URL credentials and custom events", () => {
    const url = new URL(SITE_URL);
    url.username = "private";
    url.password = "secret";
    expect(filterAnalyticsEvent({ type: "pageview", url: url.toString() })).toBeNull();
    expect(filterAnalyticsEvent({ type: "event", url: SITE_URL })).toBeNull();
  });
});

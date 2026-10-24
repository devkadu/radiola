import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const loginAsFixture = async (page: Page) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Olá, fixture/ })).toBeVisible();
};

test("public profiles use one indexed lookup and private profiles expose no activity", async ({ request }) => {
  const history = async () => (await (await request.get("http://127.0.0.1:15432/__fixture__/requests")).json()) as { pathname: string }[];
  const start = (await history()).length;
  const profile = await request.get("/u/fixture");
  expect(profile.status()).toBe(200);
  const html = await profile.text();
  expect(html).toContain("fixture");
  expect(html).not.toContain("fixture@example.test");
  const calls = (await history()).slice(start);
  expect(calls.filter(call => call.pathname === "/rest/v1/profile_directory")).toHaveLength(1);
  expect(calls.filter(call => call.pathname === "/auth/v1/admin/users/11111111-1111-4111-8111-111111111111")).toHaveLength(1);
  expect(calls.some(call => call.pathname === "/auth/v1/admin/users")).toBe(false);

  const beforePrivate = (await history()).length;
  const privateProfile = await request.get("/u/fixture-private");
  expect(await privateProfile.text()).toContain("Perfil privado");
  const privateCalls = (await history()).slice(beforePrivate);
  expect(privateCalls.some(call => ["/rest/v1/user_series", "/rest/v1/watched_episodes", "/rest/v1/comments"].includes(call.pathname))).toBe(false);

  const beforeMissing = (await history()).length;
  const missing = await request.get("/u/missing-profile");
  expect(await missing.text()).toContain("Usuário não encontrado");
  const missingCalls = (await history()).slice(beforeMissing);
  expect(missingCalls.some(call => call.pathname.startsWith("/auth/v1/admin/users"))).toBe(false);
});

test("new publishable key authenticates browser requests and survives a page reload", async ({ page }) => {
  const loginRequest = page.waitForRequest((request) => request.url().includes("/auth/v1/token"));
  await loginAsFixture(page);
  expect((await loginRequest).headers().apikey).toBe("sb_publishable_fixture");
  await page.goto("/perfil");
  await page.reload();
  await expect(page.getByRole("heading", { name: "fixture", exact: true })).toBeVisible();
  const overview = await page.request.get("/api/profile/overview");
  expect(overview.status()).toBe(200);
  expect(overview.headers()["cache-control"]).toBe("private, no-store");
  await page.getByTitle("Sair", { exact: true }).click();
  await expect(page.getByRole("heading", { name: /Acabou o episódio/ })).toBeVisible();
  const afterLogout = await page.request.get("/api/profile/overview");
  expect(afterLogout.status()).toBe(401);
});

test("a failed global logout clears local private content and reports the remaining uncertainty", async ({ page }) => {
  await loginAsFixture(page);
  await page.goto("/perfil");
  await page.route("**/auth/v1/logout?**", (route) => route.fulfill({
    status: 500, contentType: "application/json", body: JSON.stringify({ message: "Logout unavailable" }),
  }));
  await page.getByTitle("Sair", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Você saiu deste dispositivo." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Acabou o episódio/ })).toBeVisible();
  await expect(page.getByTitle("Sair", { exact: true })).not.toBeVisible();
  expect((await page.request.get("/api/profile/overview")).status()).toBe(401);
});

test("authenticated writes reject forged ownership, unknown settings and an unowned list", async ({ page }) => {
  await loginAsFixture(page);
  const favorite = await page.request.post("/api/profile/favorites", {
    data: { seriesId: 700, user_id: "another-user" },
  });
  expect(favorite.status()).toBe(400);
  const preferences = await page.request.patch("/api/profile/settings", {
    data: { profile_public: false, role: "admin" },
  });
  expect(preferences.status()).toBe(400);
  const list = await page.request.post("/api/lists/33333333-3333-4333-8333-333333333333/series", {
    data: { series_id: 700, series_name: "Série", series_slug: "serie-700" },
  });
  expect(list.status()).toBe(404);
  const cache = await page.request.post("/api/cache-episodes", { data: { seriesId: 700 } });
  expect(cache.status()).toBe(403);
});

test("all private API families reject an anonymous session", async ({ request }) => {
  const operations = [
    ["GET", "/api/profile/overview"], ["GET", "/api/profile/watched"],
    ["GET", "/api/profile/next-episodes"], ["GET", "/api/profile/series-progress"],
    ["PATCH", "/api/profile/settings"], ["DELETE", "/api/profile/favorites"],
    ["GET", "/api/lists"], ["POST", "/api/lists"],
    ["GET", "/api/lists/unknown"], ["DELETE", "/api/lists/unknown"],
    ["POST", "/api/lists/unknown/series"], ["DELETE", "/api/lists/unknown/series/700"],
    ["POST", "/api/feedback"], ["POST", "/api/admin/moderation"],
    ["PUT", "/api/admin/articles"], ["DELETE", "/api/admin/articles"],
  ];
  for (const [method, url] of operations) {
    const response = await request.fetch(url, { method });
    expect(response.status(), `${method} ${url}`).toBe(401);
  }
});

test("the app proxy refuses ClaudeBot while exposing its robots policy", async ({
  request,
}) => {
  const headers = { "User-Agent": "Mozilla/5.0 ClaudeBot/1.0" };
  const blocked = await request.get("/pessoa/1", { headers });
  expect(blocked.status()).toBe(403);
  const policy = await request.get("/robots.txt", { headers });
  expect(policy.status()).toBe(200);
  expect(await policy.text()).toContain("ClaudeBot");
  const visitor = await request.get("/series");
  expect(visitor.status()).toBe(200);
});

test("login form has accessible labels and reports a rejected login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("E-mail ou senha incorretos.", { exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("form").analyze();
  expect(accessibility.violations).toEqual([]);
});

test("an unauthenticated visitor cannot open profile or perform privileged writes", async ({
  page,
}) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/login$/);
  for (const route of [
    "/api/cache-episodes",
    "/api/admin/articles",
    "/api/profile/favorites",
    "/api/notify",
  ]) {
    const response = await page.request.post(route, { data: { seriesId: 700 } });
    expect(response.status(), route).toBe(401);
  }
});

test("a regular account logs in, sees its profile and is rejected by administration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3030/");
  await expect(page.getByRole("heading", { name: /Olá, fixture/ })).toBeVisible();
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "fixture", exact: true })).toBeVisible();
  const response = await page.request.post("/api/admin/articles", { data: {} });
  expect(response.status()).toBe(403);
  expect(errors).toEqual([]);
});

test("public home stays cached while login and logout update only the personal content", async ({
  page,
}) => {
  const anonymous = await page.request.get("/");
  expect(await anonymous.text()).toContain("Acabou o episódio.");
  const cached = await page.request.get("/");
  expect(cached.headers()["x-nextjs-cache"]).toBe("HIT");

  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("fixture@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Olá, fixture/ })).toBeVisible();
  const authenticated = await page.request.get("/");
  expect(authenticated.headers()["x-nextjs-cache"]).toBe("HIT");
  expect(await authenticated.text()).not.toContain("fixture@example.test");
  await page.getByTitle("Sair", { exact: true }).click();
  await expect(page.getByRole("heading", { name: /Acabou o episódio/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Olá, fixture/ })).not.toBeVisible();
});

test("people pages reuse HTML and fetch person details only once for metadata and content", async ({
  page,
}) => {
  const id = String(Date.now());
  const response = await page.request.get(`/pessoa/${id}`);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain("Pessoa de teste");
  const cached = await page.request.get(`/pessoa/${id}`);
  expect(cached.headers()["x-nextjs-cache"]).toBe("HIT");
  const history = await page.request.get("http://127.0.0.1:15432/__fixture__/requests");
  const requests: { pathname: string }[] = await history.json();
  expect(requests.filter((request) => request.pathname === `/3/person/${id}`)).toHaveLength(1);
  expect(
    requests.filter((request) => request.pathname === `/3/person/${id}/tv_credits`),
  ).toHaveLength(1);
});

test("catalog navigation and an unknown page render without a client exception", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/series");
  await page.getByRole("button", { name: "Drama", exact: true }).click();
  await expect(page.getByRole("link", { name: /Série de teste/ }).first()).toBeVisible();
  await page
    .getByRole("link", { name: /Série de teste/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Série de teste", exact: true })).toBeVisible();
  await page.goto("/pagina-inexistente");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile login fits the viewport and keeps navigation usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "/tmp/radiola-login-mobile.png", fullPage: true });
});

test("catalog shows a request failure instead of treating it as a successful result", async ({
  page,
}) => {
  await page.route("**/api/discover?**", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Catálogo temporariamente indisponível.",
        code: "NETWORK_ERROR",
      }),
    }),
  );
  await page.goto("/series");
  await page.getByRole("button", { name: "Drama", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Não foi possível carregar as séries.",
  );
  await expect(
    page.getByText("Nenhuma série encontrada com esses filtros.", { exact: true }),
  ).not.toBeVisible();
});

test("search composes regular and contextual queries", async ({ page }) => {
  await page.route("**/api/search?**", (route) =>
    route.fulfill({
      json: {
        series: [
          { id: 700, name: "Resultado da busca de teste", slug: "teste-700", poster_path: null },
        ],
        episodes: [],
      },
    }),
  );
  await page.route("**/api/smart-search?**", (route) =>
    route.fulfill({
      json: {
        smartAnswer: {
          type: "prod_status",
          answer: "Resposta contextual de teste",
          seriesName: "Fixture",
          tags: [],
        },
      },
    }),
  );
  await page.goto("/series");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.getByPlaceholder("Buscar série, humor, gênero...").fill("quando volta uma série");
  await expect(page.getByText("Resultado da busca de teste", { exact: true })).toBeVisible();
  await expect(page.getByText("Resposta contextual de teste", { exact: true })).toBeVisible();
});

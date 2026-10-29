import { createServer } from "node:http";

const user = {
  id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", role: "authenticated",
  email: "fixture@example.test", created_at: "2025-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { username: "fixture", profile_public: true },
};
const privateUser = {
  ...user, id: "33333333-3333-4333-8333-333333333333", email: "private@example.test",
  user_metadata: { username: "fixture-private", profile_public: false },
};
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture-signature`;
const episode = { id: 701, name: "O começo", episode_number: 1, season_number: 1, overview: "Um episódio de teste.", still_path: null, air_date: "2025-01-01", vote_average: 8, vote_count: 10, runtime: 45, crew: [], guest_stars: [] };
const series = { id: 700, name: "Série de teste", original_name: "Fixture Series", overview: "Uma série fictícia para validar a aplicação.", poster_path: null, backdrop_path: null, first_air_date: "2025-01-01", number_of_episodes: 1, number_of_seasons: 1, vote_average: 8, vote_count: 100, genres: [{ id: 18, name: "Drama" }], seasons: [{ id: 70, season_number: 1, name: "Temporada 1", episode_count: 1, poster_path: null, air_date: "2025-01-01" }], videos: { results: [] } };
const secondEpisode = { ...episode, id: 702, episode_number: 2, name: "Próximo capítulo" };
const catalogEpisodes = [
  { ...episode, series_id: 700, slug: "episodio-1-o-comeco" },
  { ...secondEpisode, series_id: 700, slug: "episodio-2-proximo-capitulo" },
];
const articles = [
  { id: "44444444-4444-4444-8444-444444444444", slug: "artigo-publicado", title: "Artigo de teste", body: "Conteúdo editorial de teste.", status: "published", published_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-02T00:00:00Z" },
  { id: "55555555-5555-4555-8555-555555555555", slug: "artigo-rascunho", title: "Rascunho de teste", body: "Texto ainda privado.", status: "draft", published_at: null, updated_at: null },
];

export function startFixtureServer(port = 15432) {
  const requests = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    requests.push({ method: request.method, pathname: url.pathname });
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3030");
    response.setHeader("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info, x-supabase-api-version");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.setHeader("Access-Control-Expose-Headers", "Content-Range");
    const send = (body, status = 200) => { response.statusCode = status; response.end(JSON.stringify(body)); };
    if (url.pathname === "/__fixture__/requests" && request.method === "GET") return send(requests);
    if (request.method === "OPTIONS") return send({});
    if (/^\/(auth|rest|storage)\//.test(url.pathname) &&
      !["sb_publishable_fixture", "sb_secret_fixture"].includes(request.headers.apikey)) {
      return send({ message: "Invalid fixture API key" }, 401);
    }
    if (url.pathname === "/auth/v1/token") {
      let body = "";
      for await (const chunk of request) body += chunk;
      const credentials = JSON.parse(body || "{}");
      if (credentials.password !== "fixture-password") return send({ error: "invalid_grant", error_description: "E-mail ou senha incorretos." }, 400);
      return send({ access_token: token, refresh_token: "fixture-refresh", token_type: "bearer", expires_in: 3600, user });
    }
    if (url.pathname === "/auth/v1/user") {
      return request.headers.authorization === `Bearer ${token}` ? send(user) : send({ message: "Invalid session" }, 401);
    }
    if (url.pathname.startsWith("/auth/v1/admin/users")) {
      if (request.headers.apikey !== "sb_secret_fixture") return send({ message: "Not authorized" }, 403);
      const target = [user, privateUser].find(account => url.pathname === `/auth/v1/admin/users/${account.id}`);
      return target ? send({ user: target }) : send({ message: "User not found" }, 404);
    }
    if (url.pathname.startsWith("/auth/")) return send({});
    // Fail closed on unexpected writes: build and browser tests cannot alter a database.
    const readRpc = url.pathname.startsWith("/rest/v1/rpc/") && ["hot_episodes", "hot_episodes_by_series", "get_top_commenters_7days", "popular_series", "get_trending_seasons"].includes(url.pathname.split("/").pop());
    if (request.method !== "GET" && request.method !== "HEAD" && !readRpc) return send({ message: "Fixture writes are disabled" }, 405);
    if (url.pathname === "/rest/v1/profile_directory") {
      if (request.headers.apikey !== "sb_secret_fixture") return send({ message: "Not authorized" }, 403);
      const target = [user, privateUser].find(account => url.searchParams.get("username") === `eq.${account.user_metadata.username}`);
      return send(target ? [{ user_id: target.id }] : []);
    }
    const catalogRows = {
      "/rest/v1/series": [{ ...series, slug: "serie-de-teste-700" }],
      "/rest/v1/episodes": catalogEpisodes,
      "/rest/v1/articles": articles,
    }[url.pathname];
    if (catalogRows) {
      if (url.pathname === "/rest/v1/articles" && request.headers.apikey !== "sb_secret_fixture") {
        return send({ message: "Not authorized" }, 403);
      }
      let rows = catalogRows.filter(row => [...url.searchParams].every(([column, filter]) => {
        if (filter.startsWith("eq.")) return String(row[column]) === filter.slice(3);
        if (filter === "not.is.null") return row[column] != null;
        if (filter.startsWith("in.(")) return filter.slice(4, -1).split(",").includes(String(row[column]));
        return true;
      }));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? rows.length);
      response.setHeader("Content-Range", rows.length ? `${offset}-${Math.min(offset + limit, rows.length) - 1}/${rows.length}` : "*/0");
      rows = rows.slice(offset, offset + limit);
      if (request.headers.accept?.includes("application/vnd.pgrst.object+json")) {
        return rows.length === 1 ? send(rows[0]) : send({ code: "PGRST116", message: "No fixture row found", details: "The result contains 0 rows" }, 406);
      }
      return send(rows);
    }
    if (url.pathname.startsWith("/rest/")) {
      response.setHeader("Content-Range", "*/0");
      if (request.headers.accept?.includes("application/vnd.pgrst.object+json")) {
        return send({ code: "PGRST116", message: "No fixture row found", details: "The result contains 0 rows" }, 406);
      }
      return send([]);
    }
    if (url.pathname.endsWith("/watch/providers/tv")) return send({ results: [] });
    if (url.pathname.endsWith("/watch/providers")) return send({ results: {} });
    if (url.pathname.includes("/genre/")) return send({ genres: [{ id: 18, name: "Drama" }] });
    if (url.pathname.endsWith("/credits") || url.pathname.endsWith("/tv_credits")) return send({ cast: [] });
    if (url.pathname.endsWith("/videos")) return send({ results: [] });
    if (/\/episode\/\d+$/.test(url.pathname)) {
      const number = Number(url.pathname.split("/").pop());
      const result = [episode, secondEpisode].find(item => item.episode_number === number);
      return result ? send(result) : send({ message: "Episode not found" }, 404);
    }
    if (/\/season\/\d+$/.test(url.pathname)) return send({ id: 70, name: "Temporada 1", season_number: 1, episodes: [episode, secondEpisode], poster_path: null, air_date: "2025-01-01" });
    if (/\/tv\/\d+$/.test(url.pathname)) return send(series);
    if (/\/person\/\d+$/.test(url.pathname)) return send({ id: 1, name: "Pessoa de teste", biography: "", profile_path: null });
    if (/\/(discover|search|trending|tv)\//.test(url.pathname)) return send({ page: 1, total_pages: 1, total_results: 1, results: [series] });
    return send({ message: "Unknown fixture endpoint" }, 404);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve({ server, requests }));
  });
}

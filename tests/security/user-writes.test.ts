import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  updateUser: vi.fn(),
  getSeriesDetails: vi.fn(),
  cacheSeries: vi.fn(),
}));
vi.mock("@/server/database/session", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, updateUser: mocks.updateUser },
    from: mocks.from,
  }),
}));
vi.mock("@/server/integrations/tmdb/requests/get-series-details", () => ({
  getSeriesDetails: mocks.getSeriesDetails,
}));
vi.mock("@/features/catalog/server/cache", () => ({
  cacheService: { cacheSeries: mocks.cacheSeries },
}));

import { POST as addFavorite, DELETE as removeFavorite } from "@/app/api/profile/favorites/route";
import { PATCH as updateSettings } from "@/app/api/profile/settings/route";
import { GET as getLists, POST as createList } from "@/app/api/lists/route";
import { POST as addListSeries } from "@/app/api/lists/[id]/series/route";
import { GET as getListDetails, DELETE as deleteList } from "@/app/api/lists/[id]/route";
import { DELETE as removeListSeries } from "@/app/api/lists/[id]/series/[seriesId]/route";

const userId = "11111111-1111-4111-8111-111111111111";
const request = (path: string, body: unknown, method = "POST") =>
  new NextRequest(`https://example.test${path}`, {
    method,
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
const query = (result: { data?: unknown; error: unknown; count?: number | null }) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of [
    chain.select,
    chain.eq,
    chain.order,
    chain.insert,
    chain.delete,
    chain.upsert,
  ]) {
    method.mockReturnValue(chain);
  }
  return chain;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  mocks.getSeriesDetails.mockResolvedValue({ id: 700, name: "Série", poster_path: null });
  mocks.cacheSeries.mockResolvedValue(undefined);
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.from.mockImplementation(() => {
    throw new Error("Unexpected database access");
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("list details and mutations", () => {
  const params = { params: Promise.resolve({ id: "owned-list", seriesId: "700" }) };
  const privateError = { code: "42501", message: "Private database detail" };

  it("does not report an unavailable ownership lookup as a missing list", async () => {
    mocks.from.mockReturnValue(query({ data: null, error: privateError }));
    const response = await getListDetails(request("/api/lists/owned-list", null, "GET"), params);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(privateError.message);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the account has no matching list", async () => {
    mocks.from.mockReturnValue(query({ data: null, error: null }));
    const response = await getListDetails(request("/api/lists/owned-list", null, "GET"), params);
    expect(response.status).toBe(404);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("does not report unavailable list items as an empty successful list", async () => {
    mocks.from
      .mockReturnValueOnce(query({ data: { id: "owned-list" }, error: null }))
      .mockReturnValueOnce(query({ data: null, error: privateError }));
    const response = await getListDetails(request("/api/lists/owned-list", null, "GET"), params);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(privateError.message);
  });

  it("marks list contents as private and scopes the lookup to the session owner", async () => {
    const ownership = query({ data: { id: "owned-list", name: "Minha lista" }, error: null });
    mocks.from.mockReturnValueOnce(ownership).mockReturnValueOnce(query({ data: [], error: null }));
    const response = await getListDetails(request("/api/lists/owned-list", null, "GET"), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(ownership.eq.mock.calls).toEqual([
      ["id", "owned-list"],
      ["user_id", userId],
    ]);
    expect(await response.json()).toMatchObject({ id: "owned-list", series: [] });
  });

  it.each(["add", "remove"])(
    "stops a %s mutation when ownership cannot be checked",
    async (operation) => {
      const ownership = query({ data: null, error: privateError });
      mocks.from.mockReturnValue(ownership);
      const response =
        operation === "add"
          ? await addListSeries(request("/api/lists/owned-list/series", {}), params)
          : await removeListSeries(
              request("/api/lists/owned-list/series/700", null, "DELETE"),
              params,
            );
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain(privateError.message);
      expect(mocks.from).toHaveBeenCalledTimes(1);
      expect(ownership.upsert).not.toHaveBeenCalled();
      expect(ownership.delete).not.toHaveBeenCalled();
    },
  );

  it.each(["list", "add", "remove"])(
    "does not expose database errors for %s writes",
    async (operation) => {
      const failed = query({ error: privateError });
      if (operation === "list") mocks.from.mockReturnValue(failed);
      else
        mocks.from
          .mockReturnValueOnce(query({ data: { id: "owned-list" }, error: null }))
          .mockReturnValueOnce(failed);
      const response =
        operation === "list"
          ? await deleteList(request("/api/lists/owned-list", null, "DELETE"), params)
          : operation === "add"
            ? await addListSeries(
                request("/api/lists/owned-list/series", {
                  series_id: 700,
                  series_name: "Série",
                  series_slug: "serie-700",
                }),
                params,
              )
            : await removeListSeries(
                request("/api/lists/owned-list/series/700", null, "DELETE"),
                params,
              );
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain(privateError.message);
    },
  );

  it.each(["700suffix", "0", "2147483648"])(
    "rejects an invalid series ID before querying: %s",
    async (seriesId) => {
      const response = await removeListSeries(
        request("/api/lists/owned-list/series/invalid", null, "DELETE"),
        {
          params: Promise.resolve({ id: "owned-list", seriesId }),
        },
      );
      expect(response.status).toBe(400);
      expect(mocks.from).not.toHaveBeenCalled();
    },
  );

  it("removes exactly the requested series after checking list ownership", async () => {
    const ownership = query({ data: { id: "owned-list" }, error: null });
    const removal = query({ error: null });
    mocks.from.mockReturnValueOnce(ownership).mockReturnValueOnce(removal);
    const response = await removeListSeries(
      request("/api/lists/owned-list/series/700", null, "DELETE"),
      params,
    );
    expect(response.status).toBe(204);
    expect(ownership.eq.mock.calls).toEqual([
      ["id", "owned-list"],
      ["user_id", userId],
    ]);
    expect(removal.eq.mock.calls).toEqual([
      ["list_id", "owned-list"],
      ["series_id", 700],
    ]);
  });
});

describe("authenticated writes", () => {
  it("rejects an invalid session before catalog lookups or database writes", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Expired token") });
    const response = await addFavorite(request("/api/profile/favorites", { seriesId: 700 }));
    expect(response.status).toBe(401);
    expect(mocks.getSeriesDetails).not.toHaveBeenCalled();
    expect(mocks.cacheSeries).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("takes the favorite owner from the verified session", async () => {
    const insert = query({ error: null });
    mocks.from.mockReturnValue(insert);
    const response = await addFavorite(request("/api/profile/favorites", { seriesId: 700 }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.from).toHaveBeenCalledWith("user_series");
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userId, series_id: 700 }),
    );
  });

  it("refuses a supplied user_id before any lookup or write", async () => {
    const response = await addFavorite(
      request("/api/profile/favorites", { seriesId: 700, user_id: "another-user" }),
    );
    expect(response.status).toBe(400);
    expect(mocks.getSeriesDetails).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("does not report a failed favorite write as success", async () => {
    mocks.from.mockReturnValue(
      query({ error: { code: "42501", message: "Private database detail" } }),
    );
    const response = await addFavorite(request("/api/profile/favorites", { seriesId: 700 }));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("Private database detail");
  });

  it("scopes favorite deletion to the verified account and series", async () => {
    const deletion = query({ error: null });
    mocks.from.mockReturnValue(deletion);
    const response = await removeFavorite(
      request("/api/profile/favorites", { seriesId: 700 }, "DELETE"),
    );
    expect(response.status).toBe(200);
    expect(deletion.eq.mock.calls).toEqual([
      ["user_id", userId],
      ["series_id", 700],
    ]);
  });

  it.each([{ role: "admin" }, { user_id: "another-user" }, {}])(
    "refuses unsupported profile metadata: %j",
    async (body) => {
      const response = await updateSettings(request("/api/profile/settings", body, "PATCH"));
      expect(response.status).toBe(400);
      expect(mocks.updateUser).not.toHaveBeenCalled();
    },
  );

  it("updates only allowed preferences through the session client", async () => {
    const response = await updateSettings(
      request("/api/profile/settings", { profile_public: false }, "PATCH"),
    );
    expect(response.status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith({ data: { profile_public: false } });
  });

  it("does not report a rejected preference update as success", async () => {
    mocks.updateUser.mockResolvedValue({ error: new Error("Auth unavailable") });
    const response = await updateSettings(
      request("/api/profile/settings", { profile_public: false }, "PATCH"),
    );
    expect(response.status).toBe(500);
  });

  it("cannot add a series to a list that is not owned by the session user", async () => {
    const ownership = query({ data: null, error: null });
    mocks.from.mockReturnValue(ownership);
    const response = await addListSeries(
      request("/api/lists/other-list/series", {
        series_id: 700,
        series_name: "Série",
        series_slug: "serie-700",
      }),
      { params: Promise.resolve({ id: "other-list" }) },
    );
    expect(response.status).toBe(404);
    expect(ownership.eq.mock.calls).toEqual([
      ["id", "other-list"],
      ["user_id", userId],
    ]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("does not create a list when its quota cannot be checked", async () => {
    const unavailable = query({ count: null, error: new Error("Database unavailable") });
    mocks.from.mockReturnValue(unavailable);
    const response = await createList(request("/api/lists", { name: "Minha lista" }));
    expect(response.status).toBe(500);
    expect(unavailable.insert).not.toHaveBeenCalled();
  });

  it("does not turn a failed list query into an empty successful result", async () => {
    mocks.from.mockReturnValue(query({ data: null, error: new Error("Database unavailable") }));
    const response = await getLists();
    expect(response.status).toBe(500);
  });

  it("rejects a missing quota result without attempting an insert", async () => {
    const unavailable = query({ count: null, error: null });
    mocks.from.mockReturnValue(unavailable);
    const response = await createList(request("/api/lists", { name: "Minha lista" }));
    expect(response.status).toBe(500);
    expect(unavailable.insert).not.toHaveBeenCalled();
  });

  it("enforces the three-list limit before inserting", async () => {
    const full = query({ count: 3, error: null });
    mocks.from.mockReturnValue(full);
    const response = await createList(request("/api/lists", { name: "Quarta lista" }));
    expect(response.status).toBe(422);
    expect(full.eq).toHaveBeenCalledWith("user_id", userId);
    expect(full.insert).not.toHaveBeenCalled();
  });

  it("creates an owned list after a successful quota check", async () => {
    const quota = query({ count: 0, error: null });
    const created = query({ data: { id: "new-list", name: "Minha lista" }, error: null });
    mocks.from.mockReturnValueOnce(quota).mockReturnValueOnce(created);
    const response = await createList(request("/api/lists", { name: " Minha lista " }));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(created.insert).toHaveBeenCalledWith({ user_id: userId, name: "Minha lista" });
    expect(await response.json()).toMatchObject({ id: "new-list", series_count: 0 });
  });
});

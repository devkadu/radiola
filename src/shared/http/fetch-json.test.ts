import { afterEach,expect,it,vi } from "vitest";
import { fetchJson } from "./fetch-json";

afterEach(() => { vi.unstubAllGlobals(); });
it("reports a blocked HTML response as an HTTP error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<h1>Forbidden</h1>", { status: 403 })));
  await expect(fetchJson("/api/test")).rejects.toMatchObject({ status: 403 });
});
it("does not treat an HTTP error JSON response as successful data", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Try again" }, { status: 503 })));
  await expect(fetchJson("/api/test")).rejects.toMatchObject({ status: 503, message: "Try again" });
});
it("accepts a successful empty mutation response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  await expect(fetchJson("/api/test", { method: "DELETE" })).resolves.toBeUndefined();
});

import { TmdbError } from "@/server/integrations/tmdb/error";
import { expect,it,vi } from "vitest";
import { withCatalogNotFound } from "./with-catalog-not-found";
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
it("turns an upstream missing record into notFound while preserving temporary failures", async () => {
  await expect(withCatalogNotFound(Promise.reject(new TmdbError(404)))).rejects.toThrow("NEXT_NOT_FOUND");
  const unavailable = new TmdbError(503);
  await expect(withCatalogNotFound(Promise.reject(unavailable))).rejects.toBe(unavailable);
});

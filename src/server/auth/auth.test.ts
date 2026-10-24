import { AccessError,requireAdmin } from "@/server/auth/auth";
import { afterEach,beforeEach,describe,expect,it,vi } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/server/database/session", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

describe("requireAdmin", () => {
  beforeEach(() => { vi.stubEnv("ADMIN_USER_ID", "admin"); });
  afterEach(() => { vi.unstubAllEnvs(); });

  it("denies an absent user even when admin configuration is absent", async () => {
    vi.stubEnv("ADMIN_USER_ID", undefined);
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });
  it("denies an authenticated user when admin configuration is absent", async () => {
    vi.stubEnv("ADMIN_USER_ID", undefined);
    getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
  it("denies a different authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "member" } }, error: null });
    await expect(requireAdmin()).rejects.toBeInstanceOf(AccessError);
  });
  it("returns a verified matching administrator", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    await expect(requireAdmin()).resolves.toMatchObject({ user: { id: "admin" } });
  });
});

import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), getUserById: vi.fn(), session: vi.fn() }));
vi.mock("@/server/database/admin", () => ({
  supabaseAdmin: { from: mocks.from, auth: { admin: { getUserById: mocks.getUserById } } },
}));
vi.mock("@/server/database/session", () => ({ createClient: mocks.session }));

import { findProfileUser } from "./find-profile-user";
import { PublicProfileView } from "../../views/public-profile-view/public-profile-view";
import { generateMetadata } from "../metadata/public-profile-view.metadata";

const user = { id: "account-a", created_at: "2025-01-01", email: "private@example.test", user_metadata: { username: "fixture", profile_public: true } } as unknown as User;
const directory = () => {
  const chain = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() };
  for (const method of [chain.select, chain.eq, chain.order, chain.limit]) method.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue({ data: { user_id: user.id }, error: null });
  return chain;
};
let lookup: ReturnType<typeof directory>;

beforeEach(() => {
  vi.clearAllMocks();
  lookup = directory();
  mocks.from.mockReturnValue(lookup);
  mocks.getUserById.mockResolvedValue({ data: { user }, error: null });
  mocks.session.mockImplementation(() => { throw new Error("Unexpected private query"); });
});

describe("indexed profile lookup", () => {
  it("looks up one ID and retrieves just that account's current Auth metadata", async () => {
    expect(await findProfileUser("fixture")).toEqual(user);
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("profile_directory");
    expect(lookup.eq).toHaveBeenCalledWith("username", "fixture");
    expect(lookup.limit).toHaveBeenCalledWith(1);
    expect(mocks.getUserById).toHaveBeenCalledExactlyOnceWith(user.id);
  });

  it("does not consult Auth for an unknown name", async () => {
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await findProfileUser("unknown")).toBeNull();
    expect(mocks.getUserById).not.toHaveBeenCalled();
  });

  it("propagates a directory failure without scanning Auth", async () => {
    lookup.maybeSingle.mockResolvedValue({ data: null, error: new Error("Missing directory") });
    await expect(findProfileUser("fixture")).rejects.toThrow("Missing directory");
    expect(mocks.getUserById).not.toHaveBeenCalled();
  });

  it("does not serve a stale name after an account rename", async () => {
    mocks.getUserById.mockResolvedValue({ data: { user: { ...user, user_metadata: { username: "renamed" } } }, error: null });
    expect(await findProfileUser("fixture")).toBeNull();
  });

  it("handles a deletion between the lookup and Auth request", async () => {
    mocks.getUserById.mockResolvedValue({ data: { user: null }, error: { status: 404 } });
    expect(await findProfileUser("fixture")).toBeNull();
  });

  it("does not disguise an Auth outage as an unknown profile", async () => {
    mocks.getUserById.mockResolvedValue({ data: { user: null }, error: new Error("Auth unavailable") });
    await expect(findProfileUser("fixture")).rejects.toThrow("Auth unavailable");
  });

  it("uses fresh privacy metadata on every request", async () => {
    mocks.getUserById.mockResolvedValueOnce({ data: { user }, error: null })
      .mockResolvedValueOnce({ data: { user: { ...user, user_metadata: { username: "fixture", profile_public: false } } }, error: null });
    expect((await findProfileUser("fixture"))?.user_metadata.profile_public).toBe(true);
    expect((await findProfileUser("fixture"))?.user_metadata.profile_public).toBe(false);
    expect(mocks.getUserById).toHaveBeenCalledTimes(2);
  });

  it("does not query activity or the visitor session for a private profile", async () => {
    mocks.getUserById.mockResolvedValue({ data: { user: { ...user, user_metadata: { username: "fixture", profile_public: false } } }, error: null });
    await PublicProfileView({ params: Promise.resolve({ username: "fixture" }) });
    expect(mocks.from).toHaveBeenCalledExactlyOnceWith("profile_directory");
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("excludes private profiles from indexing without reading their activity", async () => {
    mocks.getUserById.mockResolvedValue({ data: { user: { ...user, user_metadata: { username: "fixture", profile_public: false } } }, error: null });
    const metadata = await generateMetadata({ params: Promise.resolve({ username: "fixture" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.title).toBe("Perfil privado");
    expect(mocks.session).not.toHaveBeenCalled();
  });

  it("uses the not-found boundary for an unknown profile during metadata generation", async () => {
    lookup.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(generateMetadata({ params: Promise.resolve({ username: "unknown" }) }))
      .rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(mocks.session).not.toHaveBeenCalled();
  });
});

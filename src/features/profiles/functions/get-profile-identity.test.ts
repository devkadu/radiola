import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getProfileIdentity } from "./get-profile-identity";

const account = (metadata: Record<string, unknown>) => ({
  id: "11111111-1111-4111-8111-111111111111", email: "private.name@example.test",
  user_metadata: metadata, created_at: "2026-01-01",
}) as User;

describe("privacy defaults", () => {
  it("uses a pseudonym without revealing any part of the email", () => {
    const result = getProfileIdentity(account({ username: "  " }));
    expect(result.username).toBe("usuario-111111111111");
    expect(result.username).not.toContain("private");
    expect(result.preferences).toEqual({ profile_public: false, notify_replies: false, notify_weekly: false, notify_premiere: false });
  });
  it("preserves explicit choices and rejects string booleans as opt-ins", () => {
    const result = getProfileIdentity(account({ username: " fixture ", profile_public: true, notify_replies: "true", notify_weekly: true }));
    expect(result.username).toBe("fixture");
    expect(result.preferences).toMatchObject({ profile_public: true, notify_replies: false, notify_weekly: true });
  });
});

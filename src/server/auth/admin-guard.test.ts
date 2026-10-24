import { isAdminUser } from "@/server/auth/admin-guard";
import { describe,expect,it } from "vitest";

describe("administrative authorization", () => {
  it.each([
    [undefined, undefined], [null, "admin"], ["admin", undefined],
    ["admin", ""], ["admin", "   "], ["other-user", "admin"],
  ])("denies user %s with admin configuration %s", (user, admin) => {
    expect(isAdminUser(user, admin)).toBe(false);
  });
  it("accepts only an authenticated matching administrator", () => {
    expect(isAdminUser("admin", "admin")).toBe(true);
  });
});

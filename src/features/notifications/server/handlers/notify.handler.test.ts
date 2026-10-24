import { NextRequest } from "next/server";
import { beforeEach,expect,it,vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireUser: vi.fn(), from: vi.fn(), send: vi.fn(), getUserById: vi.fn() }));
vi.mock("@/server/auth/auth", async importOriginal => ({ ...await importOriginal<typeof import("@/server/auth/auth")>(), requireUser: mocks.requireUser }));
vi.mock("@/server/database/admin", () => ({ supabaseAdmin: { from: mocks.from, auth: { admin: { getUserById: mocks.getUserById } } } }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

import { POST } from "./notify.handler";

const replyId = "11111111-1111-4111-8111-111111111111";
const parentId = "22222222-2222-4222-8222-222222222222";
const request = (body: unknown) => new NextRequest("https://example.test/api/notify", { method: "POST", body: JSON.stringify(body) });
const chain = (result: unknown) => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result), single: vi.fn().mockResolvedValue(result) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  return query;
};
beforeEach(() => {
  mocks.requireUser.mockResolvedValue({ user: { id: "author", user_metadata: { username: "author" } }, supabase: { from: mocks.from } });
  mocks.from.mockReset(); mocks.send.mockReset();
});
it("rejects an invented reply before consulting a recipient or sending email", async () => {
  mocks.from.mockReturnValue(chain({ data: null, error: null }));
  const response = await POST(request({ type: "reply", replyCommentId: replyId }));
  expect(response.status).toBe(404);
  expect(mocks.getUserById).not.toHaveBeenCalled();
  expect(mocks.send).not.toHaveBeenCalled();
});
it("rejects external or protocol-relative links", async () => {
  for (const episodeUrl of ["https://evil.test", "//evil.test", "/\\evil.test"]) {
    const response = await POST(request({ type: "reply", replyCommentId: replyId, episodeUrl }));
    expect(response.status).toBe(400);
  }
  expect(mocks.from).not.toHaveBeenCalled();
});
it("uses the persisted parent and idempotency key and exposes a provider failure", async () => {
  mocks.from.mockReturnValueOnce(chain({ data: { parent_id: parentId, episode_id: "700-s1-e1" }, error: null }))
    .mockReturnValueOnce(chain({ data: { user_id: "recipient", episode_id: "700-s1-e1" }, error: null }));
  mocks.getUserById.mockResolvedValue({ data: { user: { email: "recipient@example.test", user_metadata: {} } }, error: null });
  mocks.send.mockResolvedValue({ data: null, error: { message: "unavailable" } });
  const response = await POST(request({ type: "reply", replyCommentId: replyId, episodeUrl: "/series/test-700" }));
  expect(response.status).toBe(500);
  expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "recipient@example.test" }), { idempotencyKey: `reply/${replyId}` });
});

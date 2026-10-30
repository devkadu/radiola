import { beforeEach, describe, expect, it, vi } from "vitest";
import { eraseAccountData, exportAccountData, listAvatarFiles } from "../../scripts/privacy-account.mjs";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

const fixture = () => {
  const effects: string[] = [];
  const rows: Record<string, Record<string, unknown>[]> = {
    comments: [{ id: "mine", user_id: owner, text: "Meu comentário" }, { id: "other", user_id: other, text: "Conteúdo alheio" }],
    user_lists: [{ id: "list-a", user_id: owner }, { id: "list-b", user_id: other }],
    user_list_series: [{ id: "series-a", list_id: "list-a" }, { id: "series-b", list_id: "list-b" }],
    moderation_queue: [{ id: "report-a", reported_by: owner, reason: "Pedido do titular" }],
    articles: [{ id: "article-a", author_id: owner, title: "Autoria" }],
  };
  let account: object | null = {
    id: owner, email: "owner@example.test", user_metadata: { username: "fixture", profile_public: false },
    app_metadata: { role: "editor", secret: "never-export-this" },
    identities: [{ provider: "google", identity_data: { token: "never-export-token" } }],
  };
  let files = [`${owner}/avatar.webp`];
  const from = vi.fn((table: string) => {
    const predicates: ((row: Record<string, unknown>) => boolean)[] = [];
    let columns: string[] | null = null;
    let updates: object | null = null;
    const chain = {
      select: vi.fn((value: string) => { columns = value.split(",").map((key) => key.trim()); return chain; }),
      eq: vi.fn((key: string, value: unknown) => { predicates.push((row) => row[key] === value); return chain; }),
      in: vi.fn((key: string, values: unknown[]) => { predicates.push((row) => values.includes(row[key])); return chain; }),
      or: vi.fn(() => { predicates.push((row) => row.follower_id === owner || row.following_id === owner); return chain; }),
      order: vi.fn(() => chain),
      update: vi.fn((value: object) => { updates = value; return chain; }),
      range: vi.fn(async (start: number, end: number) => ({
        data: (rows[table] ?? []).filter((row) => predicates.every((check) => check(row))).slice(start, end + 1)
          .map((row) => Object.fromEntries((columns ?? []).filter((key) => key in row).map((key) => [key, row[key]]))), error: null,
      })),
      then: (resolve: (value: unknown) => unknown) => {
        effects.push(`update:${table}`);
        for (const row of rows[table] ?? []) if (predicates.every((check) => check(row))) Object.assign(row, updates);
        return Promise.resolve({ data: null, error: null }).then(resolve);
      },
    };
    return chain;
  });
  const storage = {
    list: vi.fn(async (prefix: string) => ({ data: files.filter((path) => path.startsWith(`${prefix}/`)).map((path) => ({ id: path, name: path.slice(prefix.length + 1) })), error: null })),
    remove: vi.fn(async (paths: string[]) => { effects.push("remove-files"); files = files.filter((path) => !paths.includes(path)); return { data: [], error: null }; }),
  };
  const client = {
    from,
    rpc: vi.fn(async () => ({ data: 1, error: null })),
    storage: { from: vi.fn(() => storage) },
    auth: { admin: {
      getUserById: vi.fn(async () => account ? { data: { user: account }, error: null } : { data: { user: null }, error: { status: 404 } }),
      updateUserById: vi.fn(async () => { effects.push("block-account"); return { data: {}, error: null }; }),
      deleteUser: vi.fn(async () => { effects.push("delete-auth"); account = null; return { data: {}, error: null }; }),
    } },
  };
  return { client, storage, effects, rows };
};

beforeEach(() => { vi.clearAllMocks(); });

describe("operator privacy procedures with simulated integrations", () => {
  it("exports only the requested account and owned lists, without auth secrets or claims", async () => {
    const { client } = fixture();
    const data = await exportAccountData(client, owner);
    expect(data.account.email).toBe("owner@example.test");
    expect(data.account.providers).toEqual(["google"]);
    expect(data.activity.comments).toEqual([{ id: "mine", text: "Meu comentário" }]);
    expect(data.activity.user_list_series).toEqual([{ id: "series-a", list_id: "list-a" }]);
    expect(JSON.stringify(data)).not.toMatch(/never-export|Conteúdo alheio|series-b|list-b/);
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects a different confirmation before any network operation", async () => {
    const { client } = fixture();
    await expect(eraseAccountData(client, owner, other)).rejects.toThrow(/confirmação/);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(client.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("refuses deletion until database protections are installed", async () => {
    const { client } = fixture();
    client.rpc.mockResolvedValue({ data: 0, error: null });
    await expect(eraseAccountData(client, owner, owner)).rejects.toThrow(/incompatível/);
    expect(client.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("blocks before removing files and removes files before Auth", async () => {
    const { client, effects, rows } = fixture();
    await expect(eraseAccountData(client, owner, owner)).resolves.toMatchObject({ deleted: true, removed_avatar_files: 1 });
    expect(effects).toEqual(["block-account", "remove-files", "update:moderation_queue", "update:articles", "delete-auth"]);
    expect(client.auth.admin.updateUserById).toHaveBeenCalledWith(owner, {
      ban_duration: "876000h", app_metadata: { role: "editor", secret: "never-export-this", privacy_erasure_pending: true },
    });
    expect(rows.moderation_queue[0]).toMatchObject({ reported_by: null, reason: null });
    expect(rows.articles[0]).toMatchObject({ author_id: null });
    // Resuming a completed request must not fail or delete another account.
    await expect(eraseAccountData(client, owner, owner)).resolves.toMatchObject({ deleted: true, removed_avatar_files: 0 });
    expect(client.auth.admin.deleteUser).toHaveBeenCalledExactlyOnceWith(owner);
  });

  it("stops safely on Storage failure without deleting the Auth account", async () => {
    const { client, storage, effects } = fixture();
    storage.remove.mockResolvedValue({ data: [], error: { message: "Unavailable" } } as never);
    await expect(eraseAccountData(client, owner, owner)).rejects.toThrow(/conta permanece bloqueada/);
    expect(effects).toEqual(["block-account"]);
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("lists every Storage page and rejects path traversal", async () => {
    const { client, storage } = fixture();
    storage.list.mockImplementation(async (_prefix: string, options?: { offset: number }) => ({
      data: Array.from({ length: Math.max(0, Math.min(1000, 1005 - (options?.offset ?? 0))) }, (_, i) => ({ id: String(i), name: `image-${(options?.offset ?? 0) + i}.webp` })), error: null,
    }));
    expect(await listAvatarFiles(client, owner)).toHaveLength(1005);
    storage.list.mockResolvedValue({ data: [{ id: "bad", name: "../other/avatar.webp" }], error: null });
    await expect(listAvatarFiles(client, owner)).rejects.toThrow(/inesperado/);
  });
});

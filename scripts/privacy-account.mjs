/** Internal, operator-run privacy requests. Never invoked by app requests or test setup. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const assertUserId = (id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id ?? "")) {
    throw new Error("Informe um UUID válido para a conta.");
  }
};

const checked = async (operation, message) => {
  const result = await operation;
  if (result.error) throw new Error(message);
  return result.data;
};

const pages = async (build) => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const data = await checked(build().order("id").range(from, from + 999), "Falha ao ler os dados solicitados.");
    rows.push(...data ?? []);
    if (!data || data.length < 1000) return rows;
  }
};

const getAccount = async (client, id) => {
  const { data, error } = await client.auth.admin.getUserById(id);
  if (error?.status === 404) return null;
  if (error) throw new Error("Não foi possível consultar a conta.");
  return data.user;
};

export const listAvatarFiles = async (client, id) => {
  assertUserId(id);
  const files = [];
  const visit = async (prefix, depth = 0) => {
    if (depth > 10) throw new Error("Estrutura de arquivos requer revisão manual.");
    for (let offset = 0; ; offset += 1000) {
      const data = await checked(client.storage.from("avatars").list(prefix, {
        limit: 1000, offset, sortBy: { column: "name", order: "asc" },
      }), "Falha ao consultar os arquivos da conta.");
      for (const entry of data ?? []) {
        if (!entry.name || entry.name === "." || entry.name === ".." || /[\\/]/.test(entry.name)) {
          throw new Error("Nome de arquivo inesperado; revise o pedido manualmente.");
        }
        const path = `${prefix}/${entry.name}`;
        if (entry.id) files.push(path);
        else await visit(path, depth + 1);
      }
      if (!data || data.length < 1000) return;
    }
  };
  await visit(id);
  return files;
};

export const exportAccountData = async (client, id) => {
  assertUserId(id);
  const user = await getAccount(client, id);
  if (!user) throw new Error("Conta não encontrada.");
  const definitions = [
    ["comments", "id, episode_id, text, likes, created_at, parent_id", "user_id"],
    ["trailer_comments", "id, series_id, youtube_key, timestamp_sec, text, likes, created_at", "user_id"],
    ["episode_reactions", "id, episode_id, reaction_key, created_at", "user_id"],
    ["episode_likes", "id, episode_id, created_at", "user_id"],
    ["watched_episodes", "id, episode_id, watched_at", "user_id"],
    ["user_series", "id, series_id, series_name, series_slug, poster_path, created_at", "user_id"],
    ["user_lists", "id, name, is_public, created_at", "user_id"],
    ["moderation_queue", "id, comment_id, reason, status, created_at", "reported_by"],
    ["articles", "id, slug, title, subtitle, body, status, created_at, updated_at", "author_id"],
  ];
  const activity = Object.fromEntries(await Promise.all(definitions.map(async ([table, columns, field]) => [
    table, await pages(() => client.from(table).select(columns).eq(field, id)),
  ])));
  activity.follows = await pages(() => client.from("follows").select("id, follower_id, following_id, created_at")
    .or(`follower_id.eq.${id},following_id.eq.${id}`));
  const listIds = activity.user_lists.map((list) => list.id);
  activity.user_list_series = [];
  for (let offset = 0; offset < listIds.length; offset += 50) {
    activity.user_list_series.push(...await pages(() => client.from("user_list_series")
      .select("id, list_id, series_id, series_name, series_slug, poster_path, added_at")
      .in("list_id", listIds.slice(offset, offset + 50))));
  }
  const metadata = user.user_metadata ?? {};
  return {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id, email: user.email, created_at: user.created_at,
      providers: [...new Set((user.identities ?? []).map((identity) => identity.provider))],
      preferences: Object.fromEntries(["username", "avatar_url", "profile_public", "notify_replies", "notify_weekly", "notify_premiere"]
        .filter((key) => metadata[key] !== undefined).map((key) => [key, metadata[key]])),
    },
    activity,
    avatar_files: await listAvatarFiles(client, id),
  };
};

export const eraseAccountData = async (client, id, confirmation) => {
  assertUserId(id);
  if (confirmation !== id) throw new Error("A confirmação deve corresponder à conta solicitada.");
  const version = await checked(client.rpc("privacy_tools_version"), "Instale a migração de privacidade antes da exclusão.");
  if (version !== 1) throw new Error("Versão da migração de privacidade incompatível.");
  const user = await getAccount(client, id);
  if (user) {
    await checked(client.auth.admin.updateUserById(id, {
      ban_duration: "876000h",
      app_metadata: { ...user.app_metadata, privacy_erasure_pending: true },
    }), "Não foi possível bloquear a conta para exclusão.");
  }
  // Account state is checked by RLS, including Storage, even for an existing JWT.
  // On failure the account stays blocked; rerun the same operation to resume.
  const files = await listAvatarFiles(client, id);
  for (let offset = 0; offset < files.length; offset += 100) {
    await checked(client.storage.from("avatars").remove(files.slice(offset, offset + 100)), "Falha ao remover arquivos; a conta permanece bloqueada para retomar o pedido.");
  }
  await checked(client.from("moderation_queue").update({ reason: null, reported_by: null }).eq("reported_by", id), "Falha ao desvincular os pedidos de moderação.");
  await checked(client.from("articles").update({ author_id: null }).eq("author_id", id), "Falha ao desvincular a autoria editorial.");
  if (user) await checked(client.auth.admin.deleteUser(id), "Falha ao remover a conta; ela permanece bloqueada para retomar o pedido.");
  if (await getAccount(client, id)) throw new Error("A remoção da conta não foi confirmada.");
  if ((await listAvatarFiles(client, id)).length) throw new Error("Ainda existem arquivos da conta; retome o pedido.");
  return { deleted: true, removed_avatar_files: files.length };
};

const run = async () => {
  const { values } = parseArgs({ options: {
    action: { type: "string", default: "plan" },
    "user-id": { type: "string" }, "project-ref": { type: "string" },
    "confirm-user-id": { type: "string" }, "request-verified": { type: "boolean" },
    execute: { type: "boolean" }, output: { type: "string" },
  } });
  const id = values["user-id"];
  assertUserId(id);
  if (!["plan", "export", "delete"].includes(values.action)) throw new Error("Ação inválida: use plan, export ou delete.");
  if (!values["request-verified"]) throw new Error("Verifique a identidade e o pedido antes de usar --request-verified.");
  config({ path: [".env.local", ".env"], quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !values["project-ref"] || new URL(url).protocol !== "https:" || new URL(url).hostname !== `${values["project-ref"]}.supabase.co`) {
    throw new Error("Confira as credenciais e o --project-ref do projeto solicitado.");
  }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  if (values.action === "delete" && values.execute) {
    await eraseAccountData(client, id, values["confirm-user-id"]);
    console.log("Exclusão dos dados ativos confirmada. Registre o atendimento e as retenções residuais aplicáveis.");
  } else if (values.action === "export") {
    const directory = resolve("docs/private");
    const output = resolve(values.output ?? `${directory}/${id}-${Date.now()}.json`);
    if (!output.startsWith(`${directory}${sep}`)) throw new Error("Salve a exportação em docs/private, fora do controle de versão.");
    const data = await exportAccountData(client, id);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(output, JSON.stringify(data, null, 2), { flag: "wx", mode: 0o600 });
    console.log("Exportação criada em docs/private. Entregue por canal seguro e descarte a cópia de trabalho.");
  } else {
    const user = await getAccount(client, id);
    console.log(user ? "Conta localizada. Nenhum dado foi alterado." : "Conta não encontrada. Nenhum dado foi alterado.");
    console.log("Para exclusão confirmada: --action delete --execute --confirm-user-id com o mesmo UUID.");
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

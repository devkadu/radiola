/** Database maintenance: dry run by default; --run explicitly applies the plan. */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { pathToFileURL } from "node:url";

const REFERENCES = [
  ["user_series", "series_id"],
  ["user_list_series", "series_id"],
  ["series_context", "series_id"],
  ["comments", "episode_id"],
  ["watched_episodes", "episode_id"],
  ["episode_reactions", "episode_id"],
  ["episode_likes", "episode_id"],
];

export function extractSeriesId(value) {
  const match = String(value ?? "").match(/^(\d+)-s\d+-e\d+$/);
  return match ? Number(match[1]) : null;
}

async function fetchAllIds(client, table, column) {
  const ids = new Set();
  const size = 1000;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await client.from(table).select(column)
      .order(table === "series_context" ? "series_id" : "id")
      .range(offset, offset + size - 1);
    if (error) throw new Error(`Falha ao ler referências de ${table}: ${error.message}`);
    for (const row of data ?? []) ids.add(row[column]);
    if (!data || data.length < size) break;
  }
  return ids;
}

export async function planCleanup(client) {
  const references = await Promise.all(REFERENCES.map(async ([table, column]) => {
    const values = await fetchAllIds(client, table, column);
    return [...values].map((value) => column === "series_id" ? Number(value) : extractSeriesId(value));
  }));
  const active = new Set(references.flat().filter((id) => Number.isSafeInteger(id) && id > 0));
  const all = await fetchAllIds(client, "series", "id");
  return [...all].filter((id) => !active.has(Number(id)));
}

export async function runCleanup() {
  config({ path: ".env", quiet: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const ids = await planCleanup(client);
  console.log(`Séries sem referências conhecidas: ${ids.length}`);
  if (!process.argv.includes("--run")) {
    console.log("Dry run: nenhum dado foi alterado. Revise backup e plano antes de usar --run.");
    return;
  }
  for (let offset = 0; offset < ids.length; offset += 50) {
    const batch = ids.slice(offset, offset + 50);
    const { error: episodesError } = await client.from("episodes").delete().in("series_id", batch);
    if (episodesError) throw new Error(`Limpeza interrompida: ${episodesError.message}`);
    const { error } = await client.from("series").delete().in("id", batch);
    if (error) throw new Error(`Limpeza interrompida: ${error.message}`);
  }
  console.log(`Limpeza concluída: ${ids.length} séries.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCleanup().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

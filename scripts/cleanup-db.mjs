/**
 * Limpeza do banco Supabase.
 *
 * Mantém apenas séries/episódios com atividade real:
 *   - user_series (séries favoritadas)
 *   - series_context (curadoria manual)
 *   - comments, watched_episodes, episode_reactions (ids no formato {series_id}-s{n}-e{n})
 *
 * Uso:
 *   node scripts/cleanup-db.mjs          → dry-run (mostra o que seria deletado)
 *   node scripts/cleanup-db.mjs --run    → executa de verdade
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env" });

const DRY_RUN = !process.argv.includes("--run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Extrai series_id do slug "123456-s1-e1"
function extractSeriesId(episodeId) {
  if (!episodeId) return null;
  const match = String(episodeId).match(/^(\d+)-s\d/);
  return match ? Number(match[1]) : null;
}

async function fetchAllIds(table, column) {
  const ids = new Set();
  let page = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .range(page * size, (page + 1) * size - 1);
    if (error) throw new Error(`Erro em ${table}: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) ids.add(row[column]);
    if (data.length < size) break;
    page++;
  }
  return ids;
}

async function collectActiveSeriesIds() {
  console.log("Coletando series_ids com atividade real...");

  const [userSeriesIds, contextIds, commentEpIds, watchedEpIds, reactionEpIds] =
    await Promise.all([
      fetchAllIds("user_series", "series_id"),
      fetchAllIds("series_context", "series_id"),
      fetchAllIds("comments", "episode_id"),
      fetchAllIds("watched_episodes", "episode_id"),
      fetchAllIds("episode_reactions", "episode_id"),
    ]);

  const active = new Set();

  for (const id of userSeriesIds) active.add(Number(id));
  for (const id of contextIds) active.add(Number(id));

  for (const epId of [...commentEpIds, ...watchedEpIds, ...reactionEpIds]) {
    const sid = extractSeriesId(epId);
    if (sid) active.add(sid);
  }

  console.log(`  → ${active.size} séries ativas encontradas`);
  return active;
}

async function fetchAllSeriesIds() {
  console.log("Carregando todos os IDs da tabela series...");
  const ids = [];
  let page = 0;
  const size = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("series")
      .select("id")
      .range(page * size, (page + 1) * size - 1);
    if (error) throw new Error(`Erro ao listar series: ${error.message}`);
    if (!data?.length) break;
    for (const row of data) ids.push(row.id);
    if (data.length < size) break;
    page++;
    if (page % 10 === 0) process.stdout.write(`  lidas ${ids.length} séries...\r`);
  }
  console.log(`  → ${ids.length} séries no total`);
  return ids;
}

async function deleteInBatches(table, column, ids, batchSize = 100) {
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    if (!DRY_RUN) {
      const { error } = await supabase.from(table).delete().in(column, batch);
      if (error) {
        console.error(`  Erro ao deletar batch em ${table}: ${error.message}`);
        continue;
      }
    }
    deleted += batch.length;
    if (deleted % 1000 === 0 || i + batchSize >= ids.length) {
      process.stdout.write(`  ${deleted} / ${ids.length} deletados...\r`);
    }
  }
  console.log(`  → ${deleted} registros ${DRY_RUN ? "identificados para deleção" : "deletados"} em ${table}`);
  return deleted;
}

async function main() {
  console.log(`\n========================================`);
  console.log(DRY_RUN ? "  MODO DRY-RUN (nada será deletado)" : "  MODO REAL — DELETANDO DADOS");
  console.log(`========================================\n`);

  const activeIds = await collectActiveSeriesIds();
  const allSeriesIds = await fetchAllSeriesIds();

  const orphanSeriesIds = allSeriesIds.filter((id) => !activeIds.has(id));
  console.log(`\nSéries órfãs: ${orphanSeriesIds.length} de ${allSeriesIds.length} (${Math.round(orphanSeriesIds.length / allSeriesIds.length * 100)}%)`);

  console.log(`\nResumo do que será removido:`);
  console.log(`  episodes   : todos os episodes dos ${orphanSeriesIds.length.toLocaleString()} series_ids órfãos`);
  console.log(`  series     : ${orphanSeriesIds.length.toLocaleString()} linhas (de ${allSeriesIds.length.toLocaleString()})`);
  console.log(`  Séries mantidas: ${[...activeIds].sort((a,b)=>a-b).join(", ")}`);

  if (DRY_RUN) {
    console.log(`\n  Execute com --run para confirmar a limpeza.`);
    return;
  }

  // Deleta episodes diretamente por series_id, sem precisar ler toda a tabela
  console.log(`\n--- Deletando episodes órfãos (por series_id, em lotes de 50 series) ---`);
  await deleteInBatches("episodes", "series_id", orphanSeriesIds, 50);

  console.log(`\n--- Deletando series órfãs ---`);
  await deleteInBatches("series", "id", orphanSeriesIds, 200);

  console.log(`\n✓ Limpeza concluída!`);
  console.log(`  Aguarde alguns minutos para o Supabase atualizar o uso de armazenamento.`);
}

main().catch((err) => {
  console.error("Erro fatal:", err.message);
  process.exit(1);
});

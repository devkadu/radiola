import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wtaqndleieeiaofolums.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YXFuZGxlaWVlaWFvZm9sdW1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzkyNTk5NiwiZXhwIjoyMDgzNTAxOTk2fQ.gv_561V6zAr_lmR3aUAZmbDl8vkweIrpgJkxWGOkhiE"
);

// Busca IDs das séries que ainda têm episódios ou estão em user_series
const { data: usedSeries } = await supabase.from("user_series").select("series_id");
const { data: seriesWithEpisodes } = await supabase.from("episodes").select("series_id");

const keepIds = [
  ...new Set([
    ...usedSeries.map((r) => r.series_id),
    ...seriesWithEpisodes.map((r) => r.series_id),
  ]),
];
console.log(`Séries protegidas (têm episódios ou interação): ${keepIds.length}`);

// Busca IDs em lote e deleta
let deleted = 0;

// Busca todos os IDs de séries em páginas e filtra client-side
const keepSet = new Set(keepIds.map(String));
let page = 0;
const pageSize = 1000;
const toDelete = [];

console.log("Buscando séries órfãs...");
while (true) {
  const { data, error } = await supabase
    .from("series")
    .select("id")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) { console.error("Erro ao buscar:", error.message); break; }
  if (!data?.length) break;

  for (const row of data) {
    if (!keepSet.has(String(row.id))) toDelete.push(row.id);
  }
  page++;
}

console.log(`Total de séries órfãs encontradas: ${toDelete.length}`);

// Deleta uma por vez
for (const id of toDelete) {
  const { error } = await supabase.from("series").delete().eq("id", id);
  if (error) {
    console.error(`Erro ao deletar id=${id}:`, error.message);
    continue;
  }
  deleted++;
  if (deleted % 100 === 0) console.log(`Deletadas: ${deleted} / ${toDelete.length}`);
}

console.log(`\nPronto! ${deleted} séries deletadas.`);

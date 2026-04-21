/**
 * Popula a tabela series_context usando Claude Haiku.
 * Custo estimado: ~R$0,20 para 50 séries.
 *
 * Uso:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/populate-series-context.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERIES_LIST = [
  { id: 76479,  name: "The Boys" },
  { id: 100088, name: "The Last of Us" },
  { id: 95396,  name: "Severance" },
  { id: 84958,  name: "Loki" },
  { id: 66732,  name: "Stranger Things" },
  { id: 1429,   name: "Attack on Titan" },
  { id: 37854,  name: "One Piece" },
  { id: 94997,  name: "House of the Dragon" },
  { id: 1399,   name: "Game of Thrones" },
  { id: 114461, name: "Silo" },
  { id: 136315, name: "The Bear" },
  { id: 87108,  name: "The Handmaid's Tale" },
  { id: 71912,  name: "The Witcher" },
  { id: 83867,  name: "Star Wars: Andor" },
  { id: 60735,  name: "The Flash" },
  { id: 1396,   name: "Breaking Bad" },
  { id: 1418,   name: "The Big Bang Theory" },
  { id: 62286,  name: "Fear the Walking Dead" },
  { id: 63174,  name: "Lucifer" },
  { id: 72710,  name: "Dark" },
  { id: 93405,  name: "Squid Game" },
  { id: 91363,  name: "What If...?" },
  { id: 85552,  name: "Euphoria" },
  { id: 90462,  name: "Chucky" },
  { id: 202555, name: "Demolidor: Renascido" },
  { id: 113988, name: "Fallout" },
  { id: 84773,  name: "The Lord of the Rings: The Rings of Power" },
  { id: 131926, name: "White Lotus" },
  { id: 253,    name: "Alias" },
  { id: 4614,   name: "The Office" },
];

const PROMPT = (name: string) => `Você é um especialista em séries de TV. Responda sobre "${name}" com este JSON exato (sem markdown):
{
  "material": {
    "tipo": "manga" | "book" | "comic" | "game" | "none",
    "onde_parou": "onde a série parou no material original (ex: 'capítulo 120 do mangá'). null se não se aplica.",
    "onde_continuar": "onde o fã pode continuar (ex: 'Capítulo 121 do mangá Berserk'). null se não se aplica.",
    "fonte": "nome da obra + editora/plataforma. null se não se aplica."
  },
  "prod_status": "status atual em 1 frase (ex: '2ª temporada confirmada para 2026', 'cancelada', 'em exibição')",
  "similares_nomes": ["Nome Série 1", "Nome Série 2", "Nome Série 3"],
  "tags": ["array de tags como: anime, sci-fi, suspense, maratona, terror, drama, comédia, ação, fantasia, distopia, obra-adaptada"]
}`;

async function fetchContext(seriesId: number, name: string) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: PROMPT(name) }],
  });

  const text = (msg.content[0] as any).text.trim();
  return JSON.parse(text);
}

async function main() {
  console.log(`Populando ${SERIES_LIST.length} séries...\n`);

  for (const series of SERIES_LIST) {
    try {
      console.log(`→ ${series.name} (${series.id})`);
      const data = await fetchContext(series.id, series.name);

      await supabase.from("series_context").upsert({
        series_id: series.id,
        series_name: series.name,
        material: data.material,
        prod_status: data.prod_status,
        similares: [],  // populado separado para evitar dependência de ids
        tags: data.tags ?? [],
        updated_at: new Date().toISOString(),
      });

      // Salva nomes dos similares num campo extra para lookup posterior
      await supabase.from("series_context")
        .update({ similares_nomes: data.similares_nomes })
        .eq("series_id", series.id);

      console.log(`   ✓ tags: ${data.tags?.join(", ")}`);
      console.log(`   ✓ status: ${data.prod_status}`);

      // pausa para não bater rate limit
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`   ✗ Erro em ${series.name}:`, err);
    }
  }

  console.log("\nConcluído!");
}

main();

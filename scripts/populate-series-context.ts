/**
 * Popula a tabela series_context usando Claude Haiku.
 * Simula por padrão. Configure as credenciais no ambiente e use --run para
 * consumir a API paga e gravar os dados:
 *   node --experimental-strip-types scripts/populate-series-context.ts --run
 */

import { config } from "dotenv";


import { pathToFileURL } from "node:url";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

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
  "prod_status": "status atual em 1 frase considerando a data ${new Date().toISOString().slice(0, 10)} (ex: '5ª temporada estreou em novembro de 2025', 'cancelada em 2024', 'em exibição desde 2023')",
  "similares_nomes": ["Nome Série 1", "Nome Série 2", "Nome Série 3"],
  "tags": ["use apenas tags desta lista: anime, sci-fi, suspense, terror, drama, comédia, ação, fantasia, distopia, obra-adaptada, crime, romance, maratona, minissérie. Use 'minissérie' APENAS para séries com 1 temporada curta e história fechada (ex: Chernobyl, The Night Of). Use 'maratona' para séries longas com múltiplas temporadas boas pra binge. Não use os dois juntos."],
  "streaming": ["plataformas onde está disponível no Brasil, use exatamente: netflix, amazon, hbo, disney, apple, globoplay, paramount, crunchyroll"]
}`;

async function fetchContext(anthropic: Anthropic, name: string) {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: PROMPT(name) }],
  });

  const block = msg.content.find(block => block.type === "text");
  if (!block || block.type !== "text") throw new Error("Resposta sem texto");
  const raw = block.text.trim();
  const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return z.object({
    material: z.object({ tipo: z.enum(["manga", "book", "comic", "game", "none"]), onde_parou: z.string().nullable(), onde_continuar: z.string().nullable(), fonte: z.string().nullable() }),
    prod_status: z.string().max(500), similares_nomes: z.array(z.string()).max(10), tags: z.array(z.string()).max(15), streaming: z.array(z.string()).max(10),
  }).parse(JSON.parse(text));
}

export async function main() {
  if (!process.argv.includes("--run")) {
    console.log("Simulação: use --run para consumir a API e gravar os contextos.");
    return;
  }
  config({ path: ".env", quiet: true });
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!, { auth: { persistSession: false, autoRefreshToken: false } });
  console.log(`Populando ${SERIES_LIST.length} séries...\n`);

  for (const series of SERIES_LIST) {
    try {
      console.log(`→ ${series.name} (${series.id})`);
      const data = await fetchContext(anthropic, series.name);

      const { error } = await supabase.from("series_context").upsert({
        series_id: series.id,
        series_name: series.name,
        material: data.material,
        prod_status: data.prod_status,
        similares: [],
        tags: data.tags ?? [],
        similares_nomes: data.similares_nomes ?? [],
        streaming: data.streaming ?? [],
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error("Falha ao popular contextos."); process.exitCode = 1; });
}

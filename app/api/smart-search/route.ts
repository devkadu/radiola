import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Mapeamento de keywords → intent
const INTENT_MAP: { keywords: string[]; intent: string }[] = [
  { keywords: ["onde continuar", "continuar", "livro", "mangá", "manga", "capítulo", "capitulo", "material", "obra"], intent: "material" },
  { keywords: ["quando volta", "nova temporada", "confirmada", "renovada", "cancelada", "status", "novidades", "estreia"], intent: "prod_status" },
  { keywords: ["parecida", "similar", "tipo", "como", "indica", "recomenda", "ressaca", "quem gostou"], intent: "similares" },
];

function detectIntent(query: string): string | null {
  const q = query.toLowerCase();
  for (const { keywords, intent } of INTENT_MAP) {
    if (keywords.some((k) => q.includes(k))) return intent;
  }
  return null;
}

function extractSeriesName(query: string): string {
  // Remove keywords comuns para isolar o nome da série
  return query
    .replace(/onde continuar|continuar|livro|mangá|manga|capítulo|capitulo|material|obra/gi, "")
    .replace(/quando volta|nova temporada|confirmada|renovada|cancelada|status|novidades|estreia/gi, "")
    .replace(/parecida|similar|tipo como|indica|recomenda|ressaca/gi, "")
    .replace(/\?/g, "")
    .trim();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ smartAnswer: null });

  const intent = detectIntent(q);
  if (!intent) return NextResponse.json({ smartAnswer: null });

  const seriesName = extractSeriesName(q);
  if (!seriesName) return NextResponse.json({ smartAnswer: null });

  // Busca no banco por nome aproximado
  const { data } = await supabase
    .from("series_context")
    .select("*")
    .ilike("series_name", `%${seriesName}%`)
    .limit(1)
    .single();

  if (!data) return NextResponse.json({ smartAnswer: null });

  let answer: string | null = null;
  let type = intent;

  if (intent === "material" && data.material) {
    const m = data.material;
    if (m.tipo === "none") {
      answer = `${data.series_name} é uma obra original — não tem material para continuar fora da série.`;
    } else {
      answer = m.onde_parou
        ? `A série parou em: **${m.onde_parou}**.\n\nPara continuar: ${m.onde_continuar ?? "—"}${m.fonte ? `\n\n📍 ${m.fonte}` : ""}`
        : null;
    }
  } else if (intent === "prod_status" && data.prod_status) {
    answer = data.prod_status;
  } else if (intent === "similares" && data.similares_nomes?.length) {
    answer = `Quem curtiu ${data.series_name} também ama: **${data.similares_nomes.join("**, **")}**.`;
  }

  if (!answer) return NextResponse.json({ smartAnswer: null });

  return NextResponse.json(
    { smartAnswer: { type, answer, seriesName: data.series_name, tags: data.tags ?? [] } },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}

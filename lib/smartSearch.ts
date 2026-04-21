import { supabase } from "@/lib/supabase";

export interface SmartSeries {
  id: number;
  name: string;
  slug: string;
  poster_path: string | null;
}

export interface SmartAnswer {
  type: string;
  answer: string;
  seriesName: string;
  tags: string[];
  series?: SmartSeries[];
}

const INTENT_MAP: { keywords: string[]; intent: string }[] = [
  { keywords: ["onde continuar", "continuar", "livro", "mangá", "manga", "capítulo", "capitulo", "material", "obra"], intent: "material" },
  { keywords: ["quando volta", "nova temporada", "confirmada", "renovada", "cancelada", "status", "novidades", "estreia"], intent: "prod_status" },
  { keywords: ["parecidas com", "parecidas", "parecida com", "parecida", "similar", "similares", "indica", "recomenda", "ressaca", "quem gostou"], intent: "similares" },
  { keywords: [
    "comédia", "comedia", "engraçada", "engracada", "engraçado", "engracado", "humor",
    "drama", "dramática", "dramatica",
    "série de ação", "serie de acao", "séries de ação", "series de acao", "aventura",
    "terror", "suspense", "thriller", "medo", "assustadora",
    "sci-fi", "ficção científica", "ficcao cientifica", "ficção", "ficcao", "científica", "cientifica", "futurista",
    "fantasia", "fantástica", "fantastica", "medieval", "épico", "epico",
    "anime", "animação", "animacao",
    "distopia", "pós-apocalíptico", "pos-apocaliptico",
    "crime", "policial", "detetive", "investigação", "investigacao",
    "romance", "romântica", "romantica",
    "maratonar", "maratona",
  ], intent: "genre" },
];

const GENRE_TAG_MAP: { keywords: string[]; tag: string; label: string }[] = [
  { keywords: ["comédia", "comedia", "engraçada", "engracada", "engraçado", "engracado", "humor"], tag: "comédia", label: "comédia" },
  { keywords: ["drama", "dramática", "dramatica"], tag: "drama", label: "drama" },
  { keywords: ["série de ação", "serie de acao", "séries de ação", "series de acao", "aventura"], tag: "ação", label: "ação" },
  { keywords: ["terror", "medo", "assustadora"], tag: "terror", label: "terror" },
  { keywords: ["suspense", "thriller"], tag: "suspense", label: "suspense" },
  { keywords: ["sci-fi", "ficção científica", "ficcao cientifica", "ficção", "ficcao", "científica", "cientifica", "futurista"], tag: "sci-fi", label: "ficção científica" },
  { keywords: ["fantasia", "fantástica", "fantastica", "medieval", "épico", "epico"], tag: "fantasia", label: "fantasia" },
  { keywords: ["anime", "animação", "animacao"], tag: "anime", label: "anime" },
  { keywords: ["distopia", "pós-apocalíptico", "pos-apocaliptico"], tag: "distopia", label: "distopia" },
  { keywords: ["crime", "policial", "detetive", "investigação", "investigacao"], tag: "crime", label: "crime" },
  { keywords: ["romance", "romântica", "romantica"], tag: "romance", label: "romance" },
  { keywords: ["maratonar", "maratona"], tag: "maratona", label: "pra maratonar" },
];

function detectIntent(query: string): string | null {
  const q = query.toLowerCase();
  for (const { keywords, intent } of INTENT_MAP) {
    if (keywords.some((k) => q.includes(k))) return intent;
  }
  return null;
}

function extractSeriesName(query: string): string {
  return query
    .replace(/onde continuar|continuar|livro|mangá|manga|capítulo|capitulo|material|obra/gi, "")
    .replace(/quando volta|nova temporada|confirmada|renovada|cancelada|status|novidades|estreia/gi, "")
    .replace(/parecidas com|parecidas|parecida com|parecida|similares|similar|indica|recomenda|ressaca/gi, "")
    .replace(/\bséries?\b|\bseries\b/gi, "")
    .replace(/\?/g, "")
    .trim();
}

const STREAMING_MAP: { keywords: string[]; tag: string }[] = [
  { keywords: ["netflix"], tag: "netflix" },
  { keywords: ["amazon", "prime"], tag: "amazon" },
  { keywords: ["hbo", "max"], tag: "hbo" },
  { keywords: ["disney", "star+", "star plus"], tag: "disney" },
  { keywords: ["apple", "apple tv"], tag: "apple" },
  { keywords: ["globoplay", "globo"], tag: "globoplay" },
  { keywords: ["paramount"], tag: "paramount" },
  { keywords: ["crunchyroll"], tag: "crunchyroll" },
];

function detectStreaming(query: string): string | null {
  const q = query.toLowerCase();
  for (const { keywords, tag } of STREAMING_MAP) {
    if (keywords.some((k) => q.includes(k))) return tag;
  }
  return null;
}

function detectGenreTags(query: string): { tags: string[]; labels: string[] } {
  const q = query.toLowerCase();
  const tags: string[] = [];
  const labels: string[] = [];
  for (const entry of GENRE_TAG_MAP) {
    if (entry.keywords.some((k) => q.includes(k))) {
      tags.push(entry.tag);
      labels.push(entry.label);
    }
  }
  return { tags, labels };
}

export async function getSmartAnswer(q: string): Promise<SmartAnswer | null> {
  if (q.length < 3) return null;

  const intent = detectIntent(q);
  if (!intent) return null;

  if (intent === "genre") {
    const { tags, labels } = detectGenreTags(q);
    if (!tags.length) return null;

    const streaming = detectStreaming(q);

    let query2 = supabase
      .from("series_context")
      .select("series_id, series_name")
      .contains("tags", [tags[0]]);

    if (streaming) {
      query2 = query2.contains("streaming", [streaming]);
    }

    const { data: ctxRows } = await query2.limit(6);

    if (!ctxRows?.length) return null;

    const ids = ctxRows.map((r) => r.series_id);
    const { data: seriesRows } = await supabase
      .from("series")
      .select("id, name, slug, poster_path")
      .in("id", ids);

    const seriesMap = new Map((seriesRows ?? []).map((s) => [s.id, s]));
    const series: SmartSeries[] = ctxRows
      .map((r) => seriesMap.get(r.series_id) ?? { id: r.series_id, name: r.series_name, slug: "", poster_path: null })
      .filter((s) => s.slug);

    const names = series.map((s) => s.name);
    return {
      type: "discovery",
      answer: `Séries de **${labels[0]}** pra você:`,
      seriesName: "",
      tags,
      series,
    };
  }

  const seriesName = extractSeriesName(q);
  if (!seriesName) return null;

  const { data } = await supabase
    .from("series_context")
    .select("*")
    .ilike("series_name", `%${seriesName}%`)
    .limit(1)
    .single();

  if (!data) return null;

  let answer: string | null = null;

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
    answer = `Quem curtiu **${data.series_name}** também ama:`;

    const { data: seriesRows } = await supabase
      .from("series")
      .select("id, name, slug, poster_path")
      .in("name", data.similares_nomes)
      .limit(6);

    const seriesMap = new Map((seriesRows ?? []).map((s: SmartSeries) => [s.name, s]));
    const series: SmartSeries[] = data.similares_nomes
      .map((name: string) => seriesMap.get(name))
      .filter(Boolean) as SmartSeries[];

    if (series.length) {
      return { type: intent, answer, seriesName: data.series_name, tags: data.tags ?? [], series };
    }

    answer = `Quem curtiu **${data.series_name}** também ama: **${data.similares_nomes.join("**, **")}**.`;
  }

  if (!answer) return null;

  return { type: intent, answer, seriesName: data.series_name, tags: data.tags ?? [] };
}

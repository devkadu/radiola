import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE = "https://api.themoviedb.org/3";

const LISTAS = [
  { href: "/melhores/apple-tv-plus", label: "Apple TV+", sub: "Top 10 séries", color: "#a3a3a3", tmdbParams: { with_networks: "2552", "vote_count.gte": "200" } },
  { href: "/melhores/netflix", label: "Netflix", sub: "Top 10 séries", color: "#e50914", tmdbParams: { with_networks: "213", "vote_count.gte": "200" } },
  { href: "/melhores/hbo", label: "HBO", sub: "Top 10 séries", color: "#6c2bd9", tmdbParams: { with_networks: "49", "vote_count.gte": "200" } },
  { href: "/melhores/prime-video", label: "Prime Video", sub: "Top 10 séries", color: "#00a8e1", tmdbParams: { with_networks: "1024", "vote_count.gte": "200" } },
  { href: "/melhores/doramas", label: "Doramas", sub: "Top 10 K-dramas", color: "#f472b6", tmdbParams: { with_original_language: "ko", with_genres: "18", "vote_count.gte": "500" } },
  { href: "/melhores/drama", label: "Drama", sub: "Top 10 por gênero", color: "#f59e0b", tmdbParams: { with_genres: "18", "vote_count.gte": "1000" } },
  { href: "/melhores/comedia", label: "Comédia", sub: "Top 10 por gênero", color: "#34d399", tmdbParams: { with_genres: "35", "vote_count.gte": "500" } },
  { href: "/melhores/anime", label: "Anime", sub: "Top 10 animes", color: "#fb923c", tmdbParams: { with_original_language: "ja", with_genres: "16", "vote_count.gte": "500" } },
];

async function fetchTopPosters(tmdbParams: Record<string, string>): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      language: "pt-BR",
      sort_by: "vote_average.desc",
      page: "1",
      ...tmdbParams,
    });
    const res = await fetch(`${TMDB_BASE}/discover/tv?${params}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).slice(0, 8).map((s: { poster_path?: string }) => s.poster_path).filter(Boolean);
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: "Comunidade — Segunda Temporada",
  description: "Artigos, análises e discussões sobre séries.",
};

export const revalidate = 86400;

export default async function ComunidadePage() {
  const [{ data: articles }, ...posters] = await Promise.all([
    supabaseAdmin
      .from("articles")
      .select("id, title, subtitle, slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
    ...LISTAS.map((l) => fetchTopPosters(l.tmdbParams as unknown as Record<string, string>)),
  ]);

  return (
    <main className="px-4 lg:px-0 py-6 flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] mb-1">Comunidade</p>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Listas & Artigos</h1>
      </div>

      {/* Listas */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Top 10 por plataforma e gênero</p>
        <div className="flex flex-col gap-2">
          {LISTAS.map((l, i) => {
            const listPosters = posters[i] as string[];
            const tiles = Array.from({ length: 24 }, (_, j) => listPosters[j % listPosters.length] ?? null);

            return (
              <Link
                key={l.href}
                href={l.href}
                className="group relative flex items-center overflow-hidden rounded-xl h-[88px] bg-black"
              >
                {/* Mini grid rotacionado (mesmo estilo do Hero) */}
                {listPosters.length > 0 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className="absolute grid gap-1"
                      style={{
                        gridTemplateColumns: "repeat(8, 52px)",
                        gridAutoRows: "78px",
                        transform: "rotate(-8deg)",
                        transformOrigin: "center center",
                        top: "-30%",
                        left: "-5%",
                        right: "-5%",
                        bottom: "-30%",
                      }}
                    >
                      {tiles.map((p, j) => (
                        <div key={j} className="relative rounded-md overflow-hidden bg-[var(--bg-elevated)]">
                          {p && (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${p}`}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="52px"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Overlay escuro */}
                    <div className="absolute inset-0 bg-black/60" />
                    {/* Fade esquerdo para o conteúdo */}
                    <div className="absolute inset-y-0 left-0 w-48" style={{ background: "linear-gradient(to right, black 40%, transparent)" }} />
                  </div>
                )}

                {/* Barra colorida */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: l.color }} />

                {/* Conteúdo */}
                <div className="relative z-10 px-5 flex flex-col gap-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: l.color }}>{l.sub}</p>
                  <p className="text-base font-bold text-white group-hover:text-[var(--yellow)] transition-colors">{l.label}</p>
                </div>

                {/* Seta */}
                <span className="absolute right-4 z-10 text-white/40 group-hover:text-[var(--yellow)] transition-colors text-sm">→</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Artigos */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Artigos</p>
        {!articles?.length ? (
          <p className="text-sm text-[var(--text-muted)] py-10 text-center">Nenhum artigo publicado ainda.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/artigos/${a.slug}`}
                className="py-4 flex flex-col gap-1 hover:opacity-80 transition-opacity"
              >
                <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">{a.title}</h2>
                {a.subtitle && (
                  <p className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">{a.subtitle}</p>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {new Date(a.published_at).toLocaleDateString("pt-BR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

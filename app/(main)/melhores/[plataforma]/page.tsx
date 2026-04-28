import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { seriesSlug } from "@/lib/slugs";

export const revalidate = 86400; // 24h

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE = "https://api.themoviedb.org/3";

// Mapeamento plataforma → metadados + network_id TMDB
const PLATFORMS: Record<string, {
  networkId: number;
  name: string;
  slug: string;
  description: string;
  intro: string;
  color: string;
}> = {
  "apple-tv-plus": {
    networkId: 2552,
    name: "Apple TV+",
    slug: "apple-tv-plus",
    color: "#a3a3a3",
    description: "As 10 melhores séries do Apple TV+ avaliadas pelo público, do drama premiado ao sci-fi aclamado pela crítica.",
    intro: `O <strong>Apple TV+</strong> entrou no mercado de streaming em 2019 apostando em qualidade em vez de quantidade — e a estratégia funcionou. Com produções originais que acumulam Emmys e Globos de Ouro, o serviço da Apple se consolidou como um dos mais premiados da indústria.

Se você ainda não sabe por onde começar, ou quer descobrir o que o catálogo tem de melhor, esta lista reúne as <strong>10 melhores séries do Apple TV+</strong> com base nas avaliações do público no TMDB — sem spoilers e com contexto suficiente para você decidir qual assistir primeiro.`,
  },
  "netflix": {
    networkId: 213,
    name: "Netflix",
    slug: "netflix",
    color: "#e50914",
    description: "As 10 melhores séries da Netflix avaliadas pelo público, dos dramas emocionantes às produções de ficção científica.",
    intro: `A <strong>Netflix</strong> foi pioneira no streaming moderno e ainda hoje é referência quando o assunto é séries originais. Com um catálogo enorme e produções em todos os gêneros, saber o que assistir pode ser difícil.

Esta lista reúne as <strong>10 melhores séries da Netflix</strong> com base nas avaliações do público no TMDB — um ponto de partida confiável para quem quer maratonar algo de qualidade.`,
  },
  "hbo": {
    networkId: 49,
    name: "HBO",
    slug: "hbo",
    color: "#6c2bd9",
    description: "As 10 melhores séries da HBO de todos os tempos, do drama policial ao fantasy épico.",
    intro: `A <strong>HBO</strong> é sinônimo de televisão de qualidade. De The Sopranos a Game of Thrones, a emissora americana definiu o que significa uma série de prestígio — e continua produzindo conteúdo aclamado até hoje.

Esta lista reúne as <strong>10 melhores séries da HBO</strong> com base nas avaliações do público no TMDB.`,
  },
  "prime-video": {
    networkId: 1024,
    name: "Amazon Prime Video",
    slug: "prime-video",
    color: "#00a8e1",
    description: "As 10 melhores séries do Amazon Prime Video avaliadas pelo público.",
    intro: `O <strong>Amazon Prime Video</strong> investiu pesado em produções originais e hoje conta com algumas das séries mais comentadas dos últimos anos — de thrillers políticos a fantasias de alto orçamento.

Esta lista reúne as <strong>10 melhores séries do Amazon Prime Video</strong> com base nas avaliações do público no TMDB.`,
  },
};

async function getTopSeries(networkId: number) {
  const params = new URLSearchParams({
    language: "pt-BR",
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
    with_networks: networkId.toString(),
    page: "1",
  });

  const res = await fetch(`${TMDB_BASE}/discover/tv?${params}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).slice(0, 10) as TmdbSeries[];
}

interface TmdbSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  genre_ids: number[];
}

interface Props {
  params: Promise<{ plataforma: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { plataforma } = await params;
  const platform = PLATFORMS[plataforma];
  if (!platform) return {};

  const title = `As 10 Melhores Séries do ${platform.name} (${new Date().getFullYear()})`;
  return {
    title,
    description: platform.description,
    alternates: { canonical: `${siteUrl}/melhores/${platform.slug}` },
    openGraph: { title, description: platform.description, type: "article" },
  };
}

export async function generateStaticParams() {
  return Object.keys(PLATFORMS).map((p) => ({ plataforma: p }));
}

export default async function MelhoresPage({ params }: Props) {
  const { plataforma } = await params;
  const platform = PLATFORMS[plataforma];
  if (!platform) notFound();

  const series = await getTopSeries(platform.networkId);
  const title = `As 10 Melhores Séries do ${platform.name} (${new Date().getFullYear()})`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: platform.description,
    url: `${siteUrl}/melhores/${platform.slug}`,
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: "Segunda Temporada" },
    itemListElement: series.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: `${siteUrl}/series/${seriesSlug(s.name, s.id)}`,
    })),
  };

  return (
    <main className="px-4 lg:px-0 py-8 max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: platform.color }}>
          {platform.name}
        </p>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight mb-4">
          {title}
        </h1>
        <p
          className="text-sm text-[var(--text-secondary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: platform.intro }}
        />
      </div>

      {/* Lista */}
      <ol className="flex flex-col gap-6">
        {series.map((s, i) => {
          const slug = seriesSlug(s.name, s.id);
          const year = s.first_air_date ? new Date(s.first_air_date).getFullYear() : null;
          const rating = s.vote_average.toFixed(1);

          return (
            <li key={s.id}>
              <Link href={`/series/${slug}`} className="group flex gap-4 items-start">
                {/* Número */}
                <span
                  className="text-4xl font-extrabold leading-none shrink-0 w-8 text-right"
                  style={{ color: i === 0 ? platform.color : "var(--text-muted)", opacity: i === 0 ? 1 : 0.4 }}
                >
                  {i + 1}
                </span>

                {/* Poster */}
                {s.poster_path && (
                  <div className="relative w-16 shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-[var(--bg-elevated)]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                      alt={s.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="64px"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--yellow)] transition-colors">
                      {s.name}
                    </h2>
                    <span
                      className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${platform.color}22`, color: platform.color }}
                    >
                      ★ {rating}
                    </span>
                  </div>
                  {year && (
                    <p className="text-xs text-[var(--text-muted)] mb-1">{year}</p>
                  )}
                  {s.overview && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                      {s.overview}
                    </p>
                  )}
                  <p className="text-xs text-[var(--yellow)] mt-2 group-hover:underline">
                    Ver debates e episódios →
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Conclusão + CTA */}
      <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Já assistiu alguma dessas?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Na Segunda Temporada você comenta episódio por episódio, sem medo de spoiler.
          Cada série tem seu próprio espaço de debate — e a discussão só aparece depois que você marca que assistiu.
        </p>
        <div className="flex gap-3">
          <Link
            href="/criar-conta"
            className="text-sm px-5 py-2.5 rounded-full bg-[var(--yellow)] text-black font-bold hover:bg-[var(--yellow-dim)] transition-colors"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/series"
            className="text-sm px-5 py-2.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--yellow)]/40 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    </main>
  );
}

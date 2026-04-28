import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { seriesSlug } from "@/lib/slugs";
import { ShareButton } from "./ShareButton";
import { MelhoresFooter } from "./MelhoresFooter";

export const revalidate = 86400; // 24h

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_BASE = "https://api.themoviedb.org/3";

type ListConfig = {
  name: string;
  slug: string;
  description: string;
  intro: string;
  color: string;
  tmdbParams: Record<string, string>;
};

const PLATFORMS: Record<string, ListConfig> = {
  "apple-tv-plus": {
    name: "Apple TV+",
    slug: "apple-tv-plus",
    color: "#a3a3a3",
    description: "As 10 melhores séries do Apple TV+ avaliadas pelo público, do drama premiado ao sci-fi aclamado pela crítica.",
    intro: `O <strong>Apple TV+</strong> entrou no mercado de streaming em 2019 apostando em qualidade em vez de quantidade — e a estratégia funcionou. Com produções originais que acumulam Emmys e Globos de Ouro, o serviço da Apple se consolidou como um dos mais premiados da indústria.

Se você ainda não sabe por onde começar, ou quer descobrir o que o catálogo tem de melhor, esta lista reúne as <strong>10 melhores séries do Apple TV+</strong> com base nas avaliações do público no TMDB — sem spoilers e com contexto suficiente para você decidir qual assistir primeiro.`,
    tmdbParams: { with_networks: "2552" },
  },
  "netflix": {
    name: "Netflix",
    slug: "netflix",
    color: "#e50914",
    description: "As 10 melhores séries da Netflix avaliadas pelo público, dos dramas emocionantes às produções de ficção científica.",
    intro: `A <strong>Netflix</strong> foi pioneira no streaming moderno e ainda hoje é referência quando o assunto é séries originais. Com um catálogo enorme e produções em todos os gêneros, saber o que assistir pode ser difícil.

Esta lista reúne as <strong>10 melhores séries da Netflix</strong> com base nas avaliações do público no TMDB — um ponto de partida confiável para quem quer maratonar algo de qualidade.`,
    tmdbParams: { with_networks: "213" },
  },
  "hbo": {
    name: "HBO",
    slug: "hbo",
    color: "#6c2bd9",
    description: "As 10 melhores séries da HBO de todos os tempos, do drama policial ao fantasy épico.",
    intro: `A <strong>HBO</strong> é sinônimo de televisão de qualidade. De The Sopranos a Game of Thrones, a emissora americana definiu o que significa uma série de prestígio — e continua produzindo conteúdo aclamado até hoje.

Esta lista reúne as <strong>10 melhores séries da HBO</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_networks: "49" },
  },
  "prime-video": {
    name: "Amazon Prime Video",
    slug: "prime-video",
    color: "#00a8e1",
    description: "As 10 melhores séries do Amazon Prime Video avaliadas pelo público.",
    intro: `O <strong>Amazon Prime Video</strong> investiu pesado em produções originais e hoje conta com algumas das séries mais comentadas dos últimos anos — de thrillers políticos a fantasias de alto orçamento.

Esta lista reúne as <strong>10 melhores séries do Amazon Prime Video</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_networks: "1024" },
  },
  "doramas": {
    name: "Doramas",
    slug: "doramas",
    color: "#f472b6",
    description: "Os 10 melhores doramas coreanos avaliados pelo público, do romance ao thriller psicológico.",
    intro: `Os <strong>doramas coreanos</strong> conquistaram o mundo inteiro — e o Brasil não ficou de fora. Com roteiros intensos, produções impecáveis e personagens inesquecíveis, os K-dramas se tornaram um dos gêneros mais assistidos nos streamings.

Esta lista reúne os <strong>10 melhores doramas</strong> com base nas avaliações do público no TMDB — do romance clássico ao thriller que você não vai conseguir parar de assistir.`,
    tmdbParams: { with_original_language: "ko", with_genres: "18", "vote_count.gte": "500" },
  },
  "drama": {
    name: "Drama",
    slug: "drama",
    color: "#f59e0b",
    description: "As 10 melhores séries de drama avaliadas pelo público no mundo todo.",
    intro: `O gênero <strong>drama</strong> produz as séries mais premiadas e debatidas da televisão. São histórias que ficam na cabeça — personagens complexos, dilemas morais e roteiros que não têm medo de ir fundo.

Esta lista reúne as <strong>10 melhores séries de drama</strong> com base nas avaliações do público no TMDB, de diferentes países e plataformas.`,
    tmdbParams: { with_genres: "18", "vote_count.gte": "1000" },
  },
  "comedia": {
    name: "Comédia",
    slug: "comedia",
    color: "#34d399",
    description: "As 10 melhores séries de comédia avaliadas pelo público, das sitcoms clássicas às comédias modernas.",
    intro: `Uma boa <strong>série de comédia</strong> é difícil de fazer — e fácil de amar. Das sitcoms que definiram gerações às comédias contemporâneas que misturam humor e drama, este gênero tem algumas das séries mais assistidas da história.

Esta lista reúne as <strong>10 melhores séries de comédia</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_genres: "35", "vote_count.gte": "500" },
  },
  "anime": {
    name: "Anime",
    slug: "anime",
    color: "#fb923c",
    description: "Os 10 melhores animes avaliados pelo público, da ação épica ao drama psicológico.",
    intro: `Os <strong>animes</strong> deixaram de ser nicho há muito tempo. Com narrativas complexas, animações impressionantes e fãs apaixonados no mundo inteiro, as séries japonesas estão entre as produções mais bem avaliadas de todos os tempos.

Esta lista reúne os <strong>10 melhores animes</strong> com base nas avaliações do público no TMDB — para quem quer começar ou descobrir o que está perdendo.`,
    tmdbParams: { with_original_language: "ja", with_genres: "16", "vote_count.gte": "500" },
  },
};

async function getTopSeries(tmdbParams: Record<string, string>) {
  const params = new URLSearchParams({
    language: "pt-BR",
    sort_by: "vote_average.desc",
    "vote_count.gte": "200",
    page: "1",
    ...tmdbParams,
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

  const series = await getTopSeries(platform.tmdbParams);
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
        <div className="mt-4">
          <ShareButton title={title} url={`/melhores/${platform.slug}`} />
        </div>
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

      <MelhoresFooter
        plataforma={plataforma}
        platformName={platform.name}
        platformColor={platform.color}
        pageUrl={`/melhores/${platform.slug}`}
        pageTitle={title}
      />
    </main>
  );
}

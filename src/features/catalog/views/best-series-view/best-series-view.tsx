import { BEST_SERIES_PLATFORMS as PLATFORMS } from "@/features/catalog/constants/best-series";
import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { getRankedSeries } from "@/server/integrations/tmdb/requests/get-ranked-series";
import { serializeJsonLd } from "@/shared/utils/serialize-json-ld";
import { notFound } from "next/navigation";

import Image from "@/shared/components/image/image";

import Link from "next/link";

import { seriesSlug } from "@/features/catalog/utils/slugs";

import { ShareButton } from "@/features/catalog/components/share-button/share-button.client";

import { MelhoresFooter } from "@/features/catalog/components/best-series-footer/best-series-footer.client";

async function getTopSeries(tmdbParams: Record<string, string>) {
  return (await getRankedSeries({ "vote_count.gte": "200", ...tmdbParams })).slice(0, 10);
}

interface Props {
  params: Promise<{ plataforma: string }>;
}

export async function BestSeriesView({ params }: Props) {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <div className="mb-8">
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: platform.color }}
        >
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
                  style={{
                    color: i === 0 ? platform.color : "var(--text-muted)",
                    opacity: i === 0 ? 1 : 0.4,
                  }}
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
                  {year && <p className="text-xs text-[var(--text-muted)] mb-1">{year}</p>}
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

import Image from "next/image";
import Link from "next/link";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug as makeSlug } from "@/lib/slugs";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export const revalidate = 86400; // 24h — dados de pessoa mudam raramente

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const person = await tmdbService.getPersonDetails(id).catch(() => null);
  if (!person) return {};
  return {
    title: person.name,
    description: person.biography?.slice(0, 160),
    alternates: { canonical: `${siteUrl}/pessoa/${id}` },
  };
}

export default async function PessoaPage({ params }: Props) {
  const { id } = await params;

  const [person, credits] = await Promise.all([
    tmdbService.getPersonDetails(id),
    tmdbService.getPersonTvCredits(id),
  ]);

  const knownFor: TvCredit[] = (credits.cast ?? [])
    .filter((c: TvCredit) => c.poster_path)
    .sort((a: TvCredit, b: TvCredit) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    url: `${siteUrl}/pessoa/${id}`,
    ...(person.biography && { description: person.biography }),
    ...(person.profile_path && { image: `https://image.tmdb.org/t/p/w185${person.profile_path}` }),
    ...(person.birthday && { birthDate: person.birthday }),
    ...(person.place_of_birth && { birthPlace: person.place_of_birth }),
    ...(person.known_for_department && { jobTitle: person.known_for_department }),
  };

  return (
    <main className="px-4 lg:px-0 py-6 flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <div className="flex gap-5 items-start">
        <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden shrink-0 bg-[var(--bg-surface)] ring-2 ring-[var(--border)]">
          {person.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
              alt={person.name}
              fill
              className="object-cover"
              sizes="128px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{person.name}</h1>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            {person.known_for_department && (
              <span>{person.known_for_department}</span>
            )}
            {person.birthday && (
              <span>
                {new Date(person.birthday).toLocaleDateString("pt-BR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
            {person.place_of_birth && (
              <span>{person.place_of_birth}</span>
            )}
          </div>

          {person.biography && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-4 mt-1">
              {person.biography}
            </p>
          )}
        </div>
      </div>

      {/* Séries */}
      {knownFor.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-3">
            Séries conhecidas
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {knownFor.map((credit) => {
              const slug = makeSlug(credit.name, credit.id);
              return (
                <Link
                  key={`${credit.id}-${credit.character}`}
                  href={`/series/${slug}`}
                  className="flex flex-col gap-1.5 group"
                >
                  <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[var(--bg-surface)]">
                    <Image
                      src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                      alt={credit.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1 leading-tight">
                    {credit.name}
                  </p>
                  {credit.character && (
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 leading-tight -mt-1">
                      {credit.character}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

interface TvCredit {
  id: number;
  name: string;
  character: string;
  poster_path: string | null;
  vote_count: number;
}

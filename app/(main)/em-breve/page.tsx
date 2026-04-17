import Image from "next/image";
import Link from "next/link";
import { tmdbService } from "@/services/tmdb";
import { seriesSlug as makeSlug } from "@/lib/slugs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Em breve — Séries mais aguardadas para estrear",
  description:
    "Acompanhe as séries mais esperadas que estão prestes a estrear. Seja avisado quando os debates começarem.",
};

function formatAirDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export const revalidate = 86400; // 24h — grade de estreias muda pouco

export default async function EmBrevePage() {
  const data = await tmdbService.getUpcomingSeries();
  const series: TmdbSeries[] = data.results ?? [];

  return (
    <main className="px-4 lg:px-0 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">📅 Em breve</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          As séries mais aguardadas ordenadas por popularidade
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {series.map((item) => {
          const slug = makeSlug(item.name, item.id);
          return (
            <Link
              key={item.id}
              href={`/series/${slug}`}
              className="flex flex-col gap-2 group"
            >
              <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[var(--bg-surface)]">
                {item.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    📺
                  </div>
                )}
                {item.first_air_date && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 text-center capitalize">
                    {formatAirDate(item.first_air_date)}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight">
                {item.name}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

interface TmdbSeries {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

import { tmdbService } from "@/services/tmdb";
import { seriesSlug, seasonSlug, episodeSlug } from "@/lib/slugs";
import Link from "next/link";
import Image from "next/image";

const DAY_LABELS: Record<number, string> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sáb",
};

function getWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay();

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((todayDow + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d.toISOString().split("T")[0],
      dow: d.getDay(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

interface EpisodeSlot {
  seriesId: number;
  seriesName: string;
  href: string;
  seasonNumber: number;
  episodeNumber: number;
  providerLogo: string | null;
  providerName: string | null;
}

export async function WeekCalendar() {
  const weekDays = getWeekDays();
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;

  const [onTheAirData, premieresData] = await Promise.all([
    tmdbService.getOnTheAir(1).catch(() => ({ results: [] })),
    tmdbService.getPremieres(weekStart, weekEnd).catch(() => ({ results: [] })),
  ]);

  const seen = new Set<number>();
  const seriesList: any[] = [];
  for (const s of [...(onTheAirData.results ?? []), ...(premieresData.results ?? [])]) {
    if (!seen.has(s.id)) { seen.add(s.id); seriesList.push(s); }
  }

  const [details, providersAll] = await Promise.all([
    Promise.all(seriesList.slice(0, 30).map((s) => tmdbService.getSeriesDetails(String(s.id)).catch(() => null))),
    Promise.all(seriesList.slice(0, 30).map((s) => tmdbService.getWatchProviders(String(s.id)).catch(() => null))),
  ]);

  const byDay: Record<string, EpisodeSlot[]> = {};
  for (const day of weekDays) byDay[day.date] = [];

  details.forEach((s, i) => {
    if (!s) return;
    const ep =
      s.next_episode_to_air?.air_date >= weekStart && s.next_episode_to_air?.air_date <= weekEnd
        ? s.next_episode_to_air
        : s.last_episode_to_air?.air_date >= weekStart && s.last_episode_to_air?.air_date <= weekEnd
        ? s.last_episode_to_air
        : null;
    if (!ep?.air_date) return;

    const brFlatrate = providersAll[i]?.results?.BR?.flatrate ?? [];
    const provider = brFlatrate[0] ?? null;

    const slug = seriesSlug(s.name, s.id);
    const href = `/series/${slug}/${seasonSlug(ep.season_number)}/${episodeSlug(ep.episode_number, ep.name)}`;

    byDay[ep.air_date]?.push({
      seriesId: s.id,
      seriesName: s.name,
      href,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number,
      providerLogo: provider?.logo_path ?? null,
      providerName: provider?.provider_name ?? null,
    });
  });

  const hasAnyEpisode = weekDays.some((d) => byDay[d.date].length > 0);
  if (!hasAnyEpisode) return null;

  return (
    <section className="px-4 lg:px-0 pt-4 pb-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Esta semana</h2>
        <Link
          href="/em-breve"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--yellow)] transition-colors"
        >
          calendário →
        </Link>
      </div>
      <div className="border-b border-[var(--border)] mb-4" />

      {/* Mobile: scroll horizontal — Desktop: grid 7 colunas */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible">
        <div className="flex gap-2 min-w-max lg:min-w-0 lg:grid lg:grid-cols-7 pb-1">
          {weekDays.map((day) => {
            const slots = byDay[day.date].slice(0, 4);

            return (
              <div key={day.date} className="flex flex-col gap-1.5 w-[120px] lg:w-auto shrink-0 lg:shrink">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    day.isToday ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {DAY_LABELS[day.dow]}{day.isToday ? " · hoje" : ""}
                </span>

                {slots.length === 0 ? (
                  <div className="h-10 rounded-lg border border-dashed border-[var(--border)] opacity-30" />
                ) : (
                  slots.map((ep) => (
                    <Link
                      key={ep.seriesId}
                      href={ep.href}
                      className="px-2.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--yellow)]/50 hover:bg-[var(--bg-elevated)] transition-colors flex flex-col gap-1"
                    >
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight line-clamp-2">
                        {ep.seriesName}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {ep.seasonNumber}×{ep.episodeNumber}
                        </p>
                        {ep.providerLogo && (
                          <Image
                            src={`https://image.tmdb.org/t/p/w45${ep.providerLogo}`}
                            alt={ep.providerName ?? ""}
                            width={14}
                            height={14}
                            className="rounded-sm shrink-0"
                            title={ep.providerName ?? ""}
                          />
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

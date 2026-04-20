import { tmdbService } from "@/services/tmdb";
import { seriesSlug, seasonSlug, episodeSlug } from "@/lib/slugs";
import Link from "next/link";

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

  // Semana começa na segunda
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
  poster_path: string | null;
  href: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
}

export async function WeekCalendar() {
  const weekDays = getWeekDays();
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;

  const data = await tmdbService.getOnTheAir(1).catch(() => ({ results: [] }));
  const series: any[] = data.results ?? [];

  const byDay: Record<string, EpisodeSlot[]> = {};
  for (const day of weekDays) byDay[day.date] = [];

  for (const s of series) {
    const ep = s.next_episode_to_air;
    if (!ep?.air_date) continue;
    if (ep.air_date < weekStart || ep.air_date > weekEnd) continue;

    const slug = seriesSlug(s.name, s.id);
    const href = `/series/${slug}/${seasonSlug(ep.season_number)}/${episodeSlug(ep.episode_number, ep.name)}`;

    byDay[ep.air_date]?.push({
      seriesId: s.id,
      seriesName: s.name,
      poster_path: s.poster_path,
      href,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number,
      episodeName: ep.name,
    });
  }

  const hasAnyEpisode = weekDays.some((d) => byDay[d.date].length > 0);
  if (!hasAnyEpisode) return null;

  return (
    <section className="px-4 lg:px-0 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Esta semana</h2>
        <Link href="/em-breve" className="text-xs text-[var(--text-muted)] hover:text-[var(--yellow)] transition-colors">
          calendário →
        </Link>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-1">
          {weekDays.map((day) => {
            const slots = byDay[day.date].slice(0, 4);
            if (slots.length === 0 && !day.isToday) return null;

            return (
              <div key={day.date} className="flex flex-col gap-1.5 w-[108px] shrink-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    day.isToday
                      ? "text-[var(--yellow)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {DAY_LABELS[day.dow]}{day.isToday ? " · hoje" : ""}
                </span>

                {slots.length === 0 ? (
                  <div className="h-8 rounded-lg border border-dashed border-[var(--border)] opacity-40" />
                ) : (
                  slots.map((ep) => (
                    <Link
                      key={ep.seriesId}
                      href={ep.href}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--yellow)]/50 hover:bg-[var(--bg-elevated)] transition-colors"
                      title={`${ep.seriesName} · T${String(ep.seasonNumber).padStart(2,"0")}E${String(ep.episodeNumber).padStart(2,"0")}`}
                    >
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight line-clamp-2">
                        {ep.seriesName}
                      </p>
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

import Link from "next/link";

const seasons = [
  {
    series: "Breaking Bad",
    season: "Temporada 5",
    episodes: 16,
    comments: "1.2k",
    emoji: "🧪",
  },
  {
    series: "Battlestar Galactica",
    season: "Temporada 2",
    episodes: 20,
    comments: "430",
    emoji: "🚀",
  },
  {
    series: "Dark",
    season: "Temporada 3",
    episodes: 8,
    comments: "290",
    emoji: "🧩",
  },
];

export const TrendingSeasons = () => {
  return (
    <section className="px-4 lg:px-0 py-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Temporadas em alta</h2>
        <Link
          href="/series"
          className="text-sm text-[var(--yellow)] hover:text-[var(--yellow-dim)] transition-colors"
        >
          Ver mais →
        </Link>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-4">Salte direto para a temporada certa</p>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-3">
        {seasons.map((s) => (
          <div
            key={`${s.series}-${s.season}`}
            className="shrink-0 w-52 lg:w-auto bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--text-muted)] transition-colors cursor-pointer"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--yellow)] mb-1">
              {s.series}
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{s.emoji}</span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{s.season}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {s.episodes} ep · {s.comments} comentários
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

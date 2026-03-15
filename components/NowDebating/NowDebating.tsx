import Link from "next/link";

const debates = [
  {
    rank: 1,
    series: "Breaking Bad",
    episode: '"Ozymandias"',
    code: "T05E14",
    comments: 312,
    time: "48 agora",
  },
  {
    rank: 2,
    series: "Severance",
    episode: '"Who Is Alive?"',
    code: "T02E10",
    comments: 189,
    time: "31 agora",
  },
  {
    rank: 3,
    series: "The Last of Us",
    episode: '"Long Long Time"',
    code: "T01E03",
    comments: 97,
    time: "18 agora",
  },
];

export const NowDebating = () => {
  return (
    <section className="px-4 pb-24">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Em debate agora</h3>
        <Link href="/debates" className="text-sm text-[var(--brand-yellow)]">
          Ver mais →
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {debates.map((item) => (
          <div
            key={item.rank}
            className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl px-4 py-3 border border-[var(--border-muted)]"
          >
            <span className="text-2xl font-bold text-gray-600 w-6 shrink-0">
              {item.rank}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--brand-yellow)] font-medium">{item.series}</p>
              <p className="text-sm font-medium truncate">
                {item.episode} · {item.code}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.comments} comentários · {item.time}
              </p>
            </div>
            <span className="text-gray-600 text-lg">›</span>
          </div>
        ))}
      </div>
    </section>
  );
};

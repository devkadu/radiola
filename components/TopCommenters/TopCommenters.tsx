const commenters = [
  { rank: 1, initials: "AL", name: "alice_bsg", comments: 84, hot: true, color: "#2980b9" },
  { rank: 2, initials: "RM", name: "rafamelo", comments: 71, hot: false, color: "#27ae60" },
  { rank: 3, initials: "JK", name: "juliakw", comments: 58, hot: false, color: "#8e44ad" },
  { rank: 4, initials: "CP", name: "carlospadilha", comments: 43, hot: false, color: "#c0392b" },
];

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export const TopCommenters = () => {
  return (
    <section className="px-4 lg:px-0 py-6 pb-28 lg:pb-10">
      <div className="mb-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Top da semana</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Quem mais está movimentando os debates
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {commenters.map((c) => (
          <div
            key={c.name}
            className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[var(--text-muted)] transition-colors"
          >
            <p className="text-xs text-[var(--text-muted)] self-start">
              {medals[c.rank] ?? `${c.rank}º`}
            </p>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.initials}
            </div>
            <p className="text-sm text-[var(--text-primary)] font-medium text-center truncate w-full">
              {c.name}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{c.comments} comentários</p>
            {c.hot && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--yellow)] text-[var(--yellow)]">
                em alta
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

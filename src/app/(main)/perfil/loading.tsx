const Bone = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-xl bg-[var(--bg-elevated)] ${className}`} />
);

export default function Loading() {
  return (
    <main className="pb-28 min-h-screen">

      {/* Hero banner */}
      <div className="relative">
        <div className="h-44 bg-[var(--bg-elevated)] animate-pulse" />
        {/* Avatar */}
        <div className="absolute bottom-0 left-5 translate-y-1/2 z-10">
          <div className="w-[72px] h-[72px] rounded-full bg-[var(--bg-surface)] ring-4 ring-[var(--bg)] animate-pulse" />
        </div>
      </div>

      {/* Nome + badges */}
      <div className="px-5 pt-12 pb-3 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-36" />
          <Bone className="h-4 w-48" />
        </div>
        <Bone className="h-8 w-28 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] px-5 mb-4 gap-6">
        <Bone className="h-4 w-12 mb-3" />
        <Bone className="h-4 w-20 mb-3" />
      </div>

      <div className="px-4 flex flex-col gap-3">

        {/* Bento stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card grande */}
          <div className="row-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between min-h-[140px] animate-pulse">
            <Bone className="h-3 w-16" />
            <div className="flex flex-col gap-2">
              <Bone className="h-12 w-20" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2 animate-pulse">
              <Bone className="h-3 w-16" />
              <Bone className="h-8 w-12" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Card listas */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 animate-pulse flex flex-col gap-3">
          <Bone className="h-3 w-24" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Bone key={i} className="aspect-[2/3] w-full rounded-xl" />
            ))}
          </div>
        </div>

        {/* Card avaliações */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 animate-pulse flex flex-col gap-3">
          <Bone className="h-3 w-28" />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <Bone className="h-8 w-10" />
              <Bone className="h-3 w-16" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Bone key={i} className="h-2 w-full" />
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

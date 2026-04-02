export default function Loading() {
  return (
    <main className="px-4 py-6 max-w-lg pb-28 flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-32 rounded-xl bg-[var(--bg-elevated)]" />
      <div className="h-40 rounded-2xl bg-[var(--bg-elevated)]" />
      <div className="h-24 rounded-2xl bg-[var(--bg-elevated)]" />
      <div className="h-48 rounded-2xl bg-[var(--bg-elevated)]" />
    </main>
  );
}

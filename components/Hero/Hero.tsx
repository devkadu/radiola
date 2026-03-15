export const Hero = () => {
  return (
    <section className="px-4 pt-6 pb-8">
      <p className="text-[var(--brand-yellow)] text-xs font-semibold uppercase tracking-widest mb-3">
        Sem spoiler. Sem drama.
      </p>
      <h2 className="text-3xl font-extrabold leading-tight mb-4">
        Debate cada{" "}
        <span className="text-[var(--brand-yellow)]">episódio</span>
        <br />
        no seu tempo
      </h2>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">
        Uma comunidade para quem leva séries a sério — comentários organizados
        por episódio, sempre no seu ritmo.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 rounded-full border border-[var(--foreground)] text-sm font-medium hover:bg-white/10 transition-colors">
          Criar conta grátis
        </button>
        <button className="flex-1 py-2.5 rounded-full border border-[var(--border-muted)] text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors">
          Como funciona
        </button>
      </div>
    </section>
  );
};

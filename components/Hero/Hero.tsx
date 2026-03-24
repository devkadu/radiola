export const Hero = () => {
  return (
    <section className="px-4 pt-6 pb-8">
      <p className="text-[var(--yellow)] text-xs font-semibold uppercase tracking-widest mb-3">
        Aqui sua série continua!
      </p>
      <h2 className="text-3xl font-extrabold leading-tight mb-4 text-[var(--text-primary)]">
        Debate cada{" "}
        <span className="text-[var(--yellow)]">episódio</span>
        <br />
        no seu tempo
      </h2>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
        Uma comunidade para quem leva séries a sério — comentários organizados por episódio.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 py-2.5 rounded-full bg-[var(--yellow)] text-black text-sm font-bold hover:bg-[var(--yellow-dim)] transition-colors">
          Criar conta grátis
        </button>
        <button className="flex-1 py-2.5 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-white/5 transition-colors">
          Como funciona
        </button>
      </div>
    </section>
  );
};

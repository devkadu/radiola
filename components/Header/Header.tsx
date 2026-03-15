import { FaMagnifyingGlass } from "react-icons/fa6";

export const Header = () => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-[var(--background)]">
      <h1 className="text-xl font-bold tracking-tight">
        radio<span className="text-[var(--brand-yellow)]">la</span>
      </h1>
      <div className="flex items-center gap-3">
        <FaMagnifyingGlass size={18} className="text-[var(--foreground)]" />
        <button className="text-sm px-4 py-1.5 rounded-full border border-[var(--foreground)] text-[var(--foreground)] hover:bg-white/10 transition-colors">
          Entrar
        </button>
      </div>
    </header>
  );
};

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTableCells, FaTv, FaStar, FaUser } from "react-icons/fa6";

const menuItems = [
  { href: "/", label: "Início", icon: FaTableCells },
  { href: "/series", label: "Séries", icon: FaTv },
  { href: "/debates", label: "Em debate", icon: FaStar },
  { href: "/perfil", label: "Meu perfil", icon: FaUser },
];

const mySeries = [
  { name: "Battlestar Galactica", emoji: "🚀", hasNew: true },
  { name: "Breaking Bad", emoji: "🧪", hasNew: false },
  { name: "Dark", emoji: "🧩", hasNew: false },
  { name: "Severance", emoji: "👁️", hasNew: false },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen border-r border-[var(--border)] bg-[var(--bg)] sticky top-0 h-screen overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          radio<span className="text-[var(--yellow)]">la</span>
        </Link>
      </div>

      {/* Menu */}
      <nav className="px-3 flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 py-2">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--yellow-muted)] text-[var(--yellow)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Minhas séries */}
      <div className="px-3 mt-6 flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 py-2">
          Minhas Séries
        </p>
        {mySeries.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span className="text-base leading-none">{s.emoji}</span>
            <span className="flex-1 truncate">{s.name}</span>
            {s.hasNew && (
              <span className="w-2 h-2 rounded-full bg-[var(--yellow)] shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="mt-auto px-4 py-4 border-t border-[var(--border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#c0392b] flex items-center justify-center text-xs font-bold text-white shrink-0">
          CP
        </div>
        <span className="text-sm text-[var(--text-secondary)] truncate">carlospadilha</span>
      </div>
    </aside>
  );
};

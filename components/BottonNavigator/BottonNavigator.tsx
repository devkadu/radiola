"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaHouse, FaTv, FaCircleUser } from "react-icons/fa6";

const items = [
  { label: "Início", href: "/", icon: FaHouse },
  { label: "Séries", href: "/series", icon: FaTv },
  { label: "Perfil", href: "/perfil", icon: FaCircleUser },
];

export const BottonNavigator = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)] border-t border-[var(--border)] flex justify-around items-center py-3 z-50">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative">
              <Icon size={20} className={active ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"} />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />
              )}
            </div>
            <span className={`text-xs ${active ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

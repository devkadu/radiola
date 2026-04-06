"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaHouse, FaMagnifyingGlass, FaTv, FaCircleUser, FaLightbulb } from "react-icons/fa6";
import { useSearchOverlay } from "@/context/SearchContext";

export const BottonNavigator = () => {
  const pathname = usePathname();
  const { open: openSearch } = useSearchOverlay();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)] border-t border-[var(--border)] flex justify-around items-center py-3 z-40">
      <Link href="/" className="flex flex-col items-center gap-1 active:opacity-50 transition-opacity">
        <div className="relative">
          <FaHouse size={20} className={pathname === "/" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"} />
          {pathname === "/" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />}
        </div>
        <span className={`text-xs ${pathname === "/" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>Início</span>
      </Link>

      <button onClick={openSearch} className="flex flex-col items-center gap-1">
        <FaMagnifyingGlass size={20} className="text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-muted)]">Buscar</span>
      </button>

      <Link href="/series" className="flex flex-col items-center gap-1 active:opacity-50 transition-opacity">
        <div className="relative">
          <FaTv size={20} className={pathname === "/series" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"} />
          {pathname === "/series" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />}
        </div>
        <span className={`text-xs ${pathname === "/series" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>Séries</span>
      </Link>

      <Link href="/perfil" className="flex flex-col items-center gap-1 active:opacity-50 transition-opacity">
        <div className="relative">
          <FaCircleUser size={20} className={pathname === "/perfil" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"} />
          {pathname === "/perfil" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />}
        </div>
        <span className={`text-xs ${pathname === "/perfil" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>Perfil</span>
      </Link>

      <Link href="/sugestoes" className="flex flex-col items-center gap-1 active:opacity-50 transition-opacity">
        <div className="relative">
          <FaLightbulb size={20} className={pathname === "/sugestoes" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"} />
          {pathname === "/sugestoes" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />}
        </div>
        <span className={`text-xs ${pathname === "/sugestoes" ? "text-[var(--yellow)]" : "text-[var(--text-muted)]"}`}>Sugestões</span>
      </Link>
    </nav>
  );
};

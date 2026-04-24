"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaHouse, FaMagnifyingGlass, FaTv, FaCircleUser, FaFire } from "react-icons/fa6";
import { useSearchOverlay } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";

function NavDot({ active }: { active: boolean }) {
  if (!active) return null;
  return <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--yellow)]" />;
}

export const BottonNavigator = () => {
  const pathname = usePathname();
  const { open: openSearch } = useSearchOverlay();
  const { user } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const initials = username.slice(0, 2).toUpperCase();

  const tabs = [
    { href: "/", label: "Início", icon: <FaHouse size={20} /> },
    { href: null, label: "Buscar", icon: <FaMagnifyingGlass size={20} />, action: () => openSearch() },
    { href: "/series", label: "Séries", icon: <FaTv size={20} /> },
    { href: "/debates", label: "Debates", icon: <FaFire size={20} /> },
    { href: "/perfil", label: "Perfil", icon: null },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)] border-t border-[var(--border)] flex justify-around items-center py-2 z-40">
      {tabs.map((tab) => {
        const active = tab.href ? pathname === tab.href : false;
        const color = active ? "var(--yellow)" : "var(--text-muted)";

        if (tab.action) {
          return (
            <button key={tab.label} onClick={tab.action} className="flex flex-col items-center gap-0.5 px-2 py-1">
              <span style={{ color }}>{tab.icon}</span>
              <span className="text-[10px]" style={{ color }}>{tab.label}</span>
            </button>
          );
        }

        if (tab.label === "Perfil") {
          return (
            <Link key="perfil" href="/perfil" className="flex flex-col items-center gap-0.5 px-2 py-1">
              <div className="relative">
                <div
                  className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: active ? "var(--yellow)" : "var(--bg-elevated)",
                    color: active ? "black" : "var(--text-muted)",
                    border: active ? "2px solid var(--yellow)" : "2px solid var(--border)",
                  }}
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="" width={24} height={24} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                  ) : initials || <FaCircleUser size={14} />}
                </div>
                <NavDot active={active} />
              </div>
              <span className="text-[10px]" style={{ color }}>{tab.label}</span>
            </Link>
          );
        }

        return (
          <Link key={tab.href} href={tab.href!} className="flex flex-col items-center gap-0.5 px-2 py-1">
            <div className="relative">
              <span style={{ color }}>{tab.icon}</span>
              <NavDot active={active} />
            </div>
            <span className="text-[10px]" style={{ color }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

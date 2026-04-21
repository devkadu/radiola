"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaTableCells, FaTv, FaStar, FaUser, FaMagnifyingGlass, FaArrowRightFromBracket, FaLightbulb } from "react-icons/fa6";
import { createClient } from "@/lib/supabase-browser";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useSearchOverlay } from "@/context/SearchContext";
import { favoritesService } from "@/services/favorites";

const menuItems = [
  { href: "/", label: "Início", icon: FaTableCells },
  { href: "/series", label: "Séries", icon: FaTv },
  { href: "/debates", label: "Em debate", icon: FaStar },
  { href: "/perfil", label: "Meu perfil", icon: FaUser },
  { href: "/sugestoes", label: "Sugestões", icon: FaLightbulb },
];

interface Favorite {
  series_id: number;
  series_name: string;
  series_slug: string;
  poster_path: string | null;
}

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { open: openSearch } = useSearchOverlay();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };
  const username = user?.user_metadata?.username || user?.email?.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = username?.slice(0, 2).toUpperCase();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  useEffect(() => {
    if (!user) { setFavorites([]); return; }
    favoritesService.getFavorites(user.id).then(setFavorites);
  }, [user, pathname]);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] border-r border-[var(--border)] bg-[var(--bg)] sticky top-0 h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--yellow)] rounded-[10px] flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 30 30" fill="none">
              <path d="M8 7l10 8-10 8V7z" fill="#0a0a0a"/>
              <path d="M18 7l10 8-10 8V7z" fill="rgba(10,10,10,0.4)"/>
            </svg>
          </div>
          <div className="flex flex-col leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">Segunda</span>
            <span className="text-base font-extrabold tracking-tight text-[var(--text-primary)]">Temporada</span>
          </div>
        </Link>
      </div>

      {/* Busca */}
      <div className="px-3 mb-2">
        <button
          onClick={() => openSearch()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FaMagnifyingGlass size={16} />
          Buscar
        </button>
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
      <div className="px-3 mt-6 flex flex-col gap-0.5 flex-1 overflow-y-auto min-h-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 py-2">
          Minhas Séries
        </p>
        {!user && (
          <p className="text-xs text-[var(--text-muted)] px-3 py-2">
            Entre para ver suas séries
          </p>
        )}
        {user && favorites.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] px-3 py-2">
            Nenhuma série favoritada ainda
          </p>
        )}
        {favorites.map((s) => (
          <Link
            key={s.series_id}
            href={`/series/${s.series_slug}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === `/series/${s.series_slug}`
                ? "bg-[var(--yellow-muted)] text-[var(--yellow)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div className="w-7 h-7 rounded overflow-hidden shrink-0 relative bg-[var(--bg-elevated)]">
              {s.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                  alt={s.series_name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              )}
            </div>
            <span className="flex-1 truncate">{s.series_name}</span>
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="mt-auto px-4 py-4 border-t border-[var(--border)]">
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/perfil" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[var(--yellow)] flex items-center justify-center text-xs font-bold text-black">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={username ?? ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : initials}
              </div>
              <span className="text-sm text-[var(--text-secondary)] truncate">{username}</span>
            </Link>
            <button
              onClick={handleSignOut}
              title="Sair"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-elevated)] transition-colors shrink-0"
            >
              <FaArrowRightFromBracket size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" className="text-sm text-center py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Entrar
            </Link>
            <Link href="/criar-conta" className="text-sm text-center py-2 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors">
              Criar conta
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

"use client";
import { getProfileUsername } from "@/features/profiles/functions/get-profile-username";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { favoritesService } from "@/features/progress/api/favorites.api";
import { useSearchOverlay } from "@/features/search/components/search-provider/search-provider.client";
import { AppMark } from "@/shared/components/icons/app-mark/app-mark";
import { ROUTES } from "@/shared/constants/routes";
import { useQuery } from "@tanstack/react-query";
import Image from "@/shared/components/image/image";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useState } from "react";
import {
FaArrowRightFromBracket,
FaLightbulb,
FaMagnifyingGlass,
FaStar,
FaTableCells,
FaTv,
FaUser,
FaUsers,
} from "react-icons/fa6";

const menuItems = [
  { href: ROUTES.home, label: "Início", icon: FaTableCells },
  { href: ROUTES.series, label: "Séries", icon: FaTv },
  { href: ROUTES.debates, label: "Em debate", icon: FaStar },
  { href: ROUTES.community, label: "Comunidade", icon: FaUsers },
  { href: ROUTES.profile, label: "Meu perfil", icon: FaUser },
  { href: ROUTES.feedback, label: "Sugestões", icon: FaLightbulb },
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
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { open: openSearch } = useSearchOverlay();

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      router.push(ROUTES.home);
      router.refresh();
    } catch {
      setSignOutError("Não foi possível sair. Tente novamente.");
    } finally {
      setSigningOut(false);
    }
  };
  const username = user ? getProfileUsername(user) : "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const initials = username?.slice(0, 2).toUpperCase();
  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: ["profile", user?.id, "favorites"],
    queryFn: () => favoritesService.getFavorites(user!.id),
    enabled: !!user,
  });

  return (
    <aside className="hidden lg:flex flex-col w-[260px] border-r border-[var(--border)] bg-[var(--bg)] sticky top-0 h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--yellow)] rounded-[10px] flex items-center justify-center shrink-0">
            <AppMark width={22} height={22} />
          </div>
          <span
            className="text-base font-extrabold tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-[var(--text-primary)]">Segunda </span>
            <span className="text-[var(--yellow)]">Temporada</span>
          </span>
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
          <p className="text-xs text-[var(--text-muted)] px-3 py-2">Entre para ver suas séries</p>
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
            <Link
              href={ROUTES.profile}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[var(--yellow)] flex items-center justify-center text-xs font-bold text-black">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={username ?? ""}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
              </div>
              <span className="text-sm text-[var(--text-secondary)] truncate">{username}</span>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sair"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-elevated)] transition-colors shrink-0"
            >
              <FaArrowRightFromBracket size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href={ROUTES.login}
              className="text-sm text-center py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Entrar
            </Link>
            <Link
              href={ROUTES.signUp}
              className="text-sm text-center py-2 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
            >
              Criar conta
            </Link>
          </div>
        )}
        {user && signOutError && <p role="alert" className="text-xs text-red-400 mt-2">{signOutError}</p>}
      </div>
    </aside>
  );
};

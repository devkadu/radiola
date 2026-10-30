"use client";
import { getProfileUsername } from "@/features/profiles/functions/get-profile-username";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { ProfileQuickActions } from "@/features/profiles/components/profile-quick-actions/profile-quick-actions";
import { ROUTES } from "@/shared/constants/routes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaCircleUser,FaHouse,FaTv,FaUsers } from "react-icons/fa6";

function NavDot({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-(--yellow)" />
  );
}

export const BottonNavigator = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const avatarUrl = user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null;
  const username = user ? getProfileUsername(user) : "";
  const initials = username.slice(0, 2).toUpperCase();

  const tabs = [
    { href: ROUTES.home, label: "Início", icon: <FaHouse size={20} /> },
    { href: ROUTES.series, label: "Séries", icon: <FaTv size={20} /> },
    { href: ROUTES.community, label: "Comunidade", icon: <FaUsers size={20} /> },
    { href: ROUTES.profile, label: "Perfil", icon: null },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-(--bg) border-t border-(--border) flex justify-around items-center py-2 z-40">
      {tabs.map((tab) => {
        const active = tab.href ? pathname === tab.href : false;
        const color = active ? "var(--yellow)" : "var(--text-muted)";

        if (tab.label === "Perfil") {
          return (
            <ProfileQuickActions
              key={user?.id ?? "perfil"}
              active={active}
            >
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
                    <Image
                      src={avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  ) : (
                    initials || <FaCircleUser size={14} />
                  )}
                </div>
                <NavDot active={active} />
              </div>
              <span className="text-[10px]" style={{ color }}>
                {tab.label}
              </span>
            </ProfileQuickActions>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href!}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <div className="relative">
              <span style={{ color }}>{tab.icon}</span>
              <NavDot active={active} />
            </div>
            <span className="text-[10px]" style={{ color }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

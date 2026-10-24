"use client";
import { AdminTab } from "@/features/editorial/components/admin-panel/admin-panel.client";
import { UserLists } from "@/features/lists/components/user-lists/user-lists";
import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { useQuery } from "@tanstack/react-query";
import Image from "@/shared/components/image/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { calculateProfileBadges } from "../../functions/calculate-profile-badges";
import { useAvatarUpload } from "../../hooks/use-avatar-upload";
import { useProfileOverview } from "../../hooks/use-profile-overview";
import { useProfileSettings } from "../../hooks/use-profile-settings";
import type { ProfileIdentity } from "../../types/profile";
import { CalendarTab } from "../calendar-tab/calendar-tab.client";
import { ProfileComments } from "../profile-comments/profile-comments";
import { ProfileHeader } from "../profile-header/profile-header";
import { ProfileRatings } from "../profile-ratings/profile-ratings";
import { ProfileSettings } from "../profile-settings/profile-settings";
import { ProfileStats } from "../profile-stats/profile-stats";
import { ProfileVisibilityBadge as BadgePublic } from "../profile-visibility-badge/profile-visibility-badge";
export function ProfileClient({ profile, isAdmin }: { profile: ProfileIdentity; isAdmin?: boolean }) {
 const router = useRouter();
 const { signOut } = useAuth();
 const username = profile.username;
 const avatar = useAvatarUpload(profile.id, profile.avatarUrl);
 const settings = useProfileSettings(profile.preferences);
 const isPublic = settings.preferences.profile_public;
 const [now] = useState(() => Date.now());
 const [editingProfile, setEditingProfile] = useState(false);
 const [activeTab, setActiveTab] = useState<"perfil" | "calendario" | "admin">("perfil");
 const [signOutError, setSignOutError] = useState<string | null>(null);
 const overview = useProfileOverview(profile.id);
 const { favorites = [], commentCount = 0, totalLikes = 0, reactionCounts = {}, topComment = null, recentComments = [], seriesNames = {}, watchedEpisodesCount = 0 } = overview.data ?? {};
 const { data: seriesProgress = {} } = useQuery<Record<number, { watched: number; total: number }>>({
  queryKey: ["profile", profile.id, "series-progress"],
  queryFn: ({ signal }) => fetchJson(endpoints.INTERNAL.PROFILE_SERIES_PROGRESS, { signal }),
  staleTime: 5 * 60 * 1000,
 });
 const daysMember = Math.max(0, Math.floor((now - new Date(profile.createdAt).getTime()) / 86400000));
 const totalRatings = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
 const badges = calculateProfileBadges(watchedEpisodesCount, commentCount, totalRatings);
 const handleSignOut = async () => {
  setSignOutError(null);
  try {
   await signOut();
   router.push("/"); router.refresh();
  } catch { setSignOutError("Não foi possível sair. Tente novamente."); }
 };
 if (editingProfile) return <><ProfileSettings username={username} avatar={avatar} settings={settings} onBack={() => setEditingProfile(false)} onSignOut={handleSignOut} />{signOutError && <p role="alert">{signOutError}</p>}</>;
  // ── Tela principal do perfil ─────────────────────────────────────────────────
  return (
    <main className="pb-28 min-h-screen">

      <ProfileHeader username={username} createdAt={profile.createdAt} badges={badges} avatar={avatar} onEdit={() => setEditingProfile(true)} />

      {overview.isPending && <p role="status" className="px-5">Carregando seu perfil…</p>}
      {overview.error && <p role="alert" className="px-5 text-red-400">Não foi possível carregar seu perfil. <button onClick={() => void overview.refetch()}>Tentar novamente</button></p>}
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] px-5 mb-4">
        {([
          { key: "perfil", label: "Perfil" },
          { key: "calendario", label: "Calendário" },
          ...(isAdmin ? [{ key: "admin", label: "Admin" }] : []),
        ] as { key: typeof activeTab; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 px-1 mr-5 text-sm font-semibold transition-colors relative ${
              activeTab === tab.key
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--yellow)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "calendario" && <div className="px-4"><CalendarTab /></div>}
      {activeTab === "admin" && <AdminTab />}

      {activeTab === "perfil" && (
        <div className="px-4 lg:grid lg:grid-cols-[1fr_268px] lg:gap-4 lg:items-start">

          {/* Coluna esquerda */}
          <div className="flex flex-col gap-3">

            <ProfileStats daysMember={daysMember} watchedEpisodesCount={watchedEpisodesCount} favoriteCount={favorites.length} commentCount={commentCount} totalLikes={totalLikes} />

            {/* Listas */}
            <UserLists />

            <ProfileRatings reactionCounts={reactionCounts} />

            {/* Séries favoritas — mobile (no desktop vai na sidebar) */}
            {favorites.length > 0 && (
              <div className="lg:hidden bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                  Minhas séries <BadgePublic />
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {favorites.map((s) => {
                    const prog = seriesProgress[s.series_id];
                    const pct = prog?.total ? Math.min(100, Math.round((prog.watched / prog.total) * 100)) : 0;
                    return (
                      <Link key={s.series_id} href={`/series/${s.series_slug}`} className="group flex flex-col gap-1.5">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
                          {s.poster_path
                            ? <Image width={300} height={450} src={`https://image.tmdb.org/t/p/w342${s.poster_path}`} alt={s.series_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
                          }
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--yellow)] transition-colors">{s.series_name}</p>
                        {prog && prog.total > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                              <div className="h-full rounded-full bg-[var(--yellow)] transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[9px] text-[var(--text-muted)] shrink-0">{pct}%</span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <ProfileComments topComment={topComment} recentComments={recentComments} seriesNames={seriesNames} />

          </div>

          {/* Sidebar direita — desktop */}
          <div className="hidden lg:flex flex-col gap-3 sticky top-4">

            {favorites.length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Minhas séries</p>
                <div className="flex flex-col">
                  {favorites.slice(0, 6).map((s, i) => {
                    const prog = seriesProgress[s.series_id];
                    const pct = prog?.total ? Math.min(100, Math.round((prog.watched / prog.total) * 100)) : 0;
                    return (
                      <Link
                        key={s.series_id}
                        href={`/series/${s.series_slug}`}
                        className={`flex items-center gap-3 py-2.5 group hover:opacity-80 transition-opacity ${i < Math.min(favorites.length, 6) - 1 ? "border-b border-[var(--border)]" : ""}`}
                      >
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
                          {s.poster_path && (
                            <Image width={36} height={36} src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} alt={s.series_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--yellow)] transition-colors leading-tight">
                            {s.series_name}
                          </p>
                          {prog && prog.total > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="flex-1 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                                <div className="h-full rounded-full bg-[var(--yellow)]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[9px] text-[var(--text-muted)] shrink-0">{pct}%</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {favorites.length > 6 && (
                  <p className="text-xs text-[var(--text-muted)] text-center pt-3 border-t border-[var(--border)]">
                    + {favorites.length - 6} séries
                  </p>
                )}
              </div>
            )}

            {/* Link do perfil público */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Perfil público</p>
              <Link
                href={`/u/${username}`}
                className="text-xs text-[var(--yellow)] hover:underline break-all"
              >
                /u/{username}
              </Link>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{isPublic ? "Visível para todos" : "Apenas você"}</p>
            </div>

          </div>
        </div>
      )}

    </main>
  );
};

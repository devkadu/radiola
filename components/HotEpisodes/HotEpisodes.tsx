"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { favoritesService } from "@/services/favorites";

interface HotEpisode {
  rank: number;
  epId?: string;
  series: string;
  episode: string;
  code: string;
  comments: number;
  href: string;
}

const tabs = ["Episódios quentes", "Nas suas séries"];

function EpisodeList({ episodes, loading, emptyMsg }: {
  episodes: HotEpisode[];
  loading: boolean;
  emptyMsg: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-8">{emptyMsg}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {episodes.map((ep, idx) => {
        const isFirst = idx === 0;
        return (
          <Link
            key={ep.epId ?? ep.rank}
            href={ep.href}
            className={`block rounded-xl px-5 py-3 border transition-colors ${
              isFirst
                ? "bg-[var(--yellow)] border-[var(--yellow)]"
                : "bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--text-muted)]"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`text-2xl font-bold w-6 shrink-0 leading-none ${isFirst ? "text-black/30" : "text-[var(--text-muted)]"}`}>
                {ep.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-widest mb-0.5 ${isFirst ? "text-black/60" : "text-[var(--yellow)]"}`}>
                  {ep.series}
                </p>
                <p className={`text-lg font-bold leading-tight ${isFirst ? "text-black" : "text-[var(--text-primary)]"}`}>
                  {ep.episode}
                </p>
                <p className={`text-xs mt-0.5 ${isFirst ? "text-black/60" : "text-[var(--text-muted)]"}`}>
                  {ep.code}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-2xl font-bold ${isFirst ? "text-black" : "text-[var(--text-primary)]"}`}>
                  {ep.comments}
                </p>
                <p className={`text-[10px] uppercase tracking-widest ${isFirst ? "text-black/50" : "text-[var(--text-muted)]"}`}>
                  comentários
                </p>
              </div>
            </div>
            <div className={`flex items-center justify-between mt-2 pt-2 border-t ${isFirst ? "border-black/20" : "border-[var(--border)]"}`}>
              <span className={`text-xs ${isFirst ? "text-black/70" : "text-[var(--text-muted)]"}`}>
                Entrar na discussão agora
              </span>
              <span className={`text-base ${isFirst ? "text-black/60" : "text-[var(--text-muted)]"}`}>→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export const HotEpisodes = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();

  const { data: hotEpisodes = [], isLoading: hotLoading } = useQuery<HotEpisode[]>({
    queryKey: ["hot-episodes"],
    queryFn: () => fetch("/api/hot-episodes").then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const { data: myEpisodes = [], isLoading: myLoading } = useQuery<HotEpisode[]>({
    queryKey: ["my-series-episodes", user?.id],
    queryFn: async () => {
      const favorites = await favoritesService.getFavorites(user!.id);
      if (!favorites.length) return [];
      const ids = favorites.map((f: any) => f.series_id).join(",");
      return fetch(`/api/my-series-episodes?ids=${ids}`).then((r) => r.json());
    },
    enabled: activeTab === 1 && !!user,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <section className="px-4 lg:px-0 pt-4 pb-6">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeTab === i
                ? "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Aba: Nas suas séries — não logado */}
      {activeTab === 1 && !user && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Veja a atividade mais recente nas séries que você favorita.
          </p>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm px-5 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Entrar
            </Link>
            <Link href="/criar-conta" className="text-sm px-5 py-2 rounded-full bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors">
              Criar conta
            </Link>
          </div>
        </div>
      )}

      {activeTab === 0 && (
        <EpisodeList
          episodes={hotEpisodes}
          loading={hotLoading}
          emptyMsg="Nenhum episódio comentado ainda. Seja o primeiro!"
        />
      )}

      {activeTab === 1 && user && (
        <EpisodeList
          episodes={myEpisodes}
          loading={myLoading}
          emptyMsg="Nenhum comentário nas suas séries ainda."
        />
      )}
    </section>
  );
};

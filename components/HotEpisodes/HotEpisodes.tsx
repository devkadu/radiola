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

const tabs = ["Comunidade", "Nas suas séries"];

function EpisodeCard({ ep, last, first }: { ep: HotEpisode; last: boolean; first: boolean }) {
  return (
    <Link
      href={ep.href}
      className={`block px-4 py-4 transition-colors ${first ? "bg-emerald-950/40 hover:bg-emerald-950/60" : "hover:bg-[var(--bg-elevated)]"} ${!last ? "border-b border-[var(--border)]" : ""}`}
    >
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] truncate">
              {ep.series}
            </p>
            {first && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                + comentado
              </span>
            )}
          </div>
          <p className="text-base font-bold text-[var(--text-primary)] leading-snug mb-1.5">
            {ep.episode}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--text-muted)]">{ep.code}</span>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              ativo agora
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-center">
          <div className="text-right">
            <p className="text-xl font-bold text-[var(--yellow)] leading-none">{ep.comments}</p>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
              comentários
            </p>
          </div>
          <span className="text-[var(--text-muted)] text-sm">→</span>
        </div>
      </div>
    </Link>
  );
}

function EpisodeList({ episodes, loading, emptyMsg }: {
  episodes: HotEpisode[];
  loading: boolean;
  emptyMsg: string;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {[1, 2, 3, 4].map((i, idx) => (
          <div key={i} className={`h-[84px] animate-pulse bg-[var(--bg-elevated)] ${idx < 3 ? "border-b border-[var(--border)]" : ""}`} />
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {episodes.map((ep, idx) => (
        <EpisodeCard key={ep.epId ?? ep.rank} ep={ep} first={idx === 0} last={idx === episodes.length - 1} />
      ))}
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
      {/* Heading */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
        Em Alta
      </p>

      {/* Tabs — underline style */}
      <div className="flex gap-6 mb-4 border-b border-[var(--border)]">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`pb-2.5 text-sm font-semibold transition-colors relative ${
              activeTab === i
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
            {activeTab === i && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--yellow)] rounded-full" />
            )}
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

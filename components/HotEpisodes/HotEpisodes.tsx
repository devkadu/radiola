"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const hotEpisodes = [
  { rank: 1, series: "Breaking Bad", episode: '"Ozymandias"', code: "T05 · E14", debating: 48, comments: 312, href: "/series/breaking-bad-1396/temporada-5/episodio-14-ozymandias" },
  { rank: 2, series: "Severance", episode: '"Who Is Alive?"', code: "T02 · E10", debating: 31, comments: 189, href: "/series/severance-95396/temporada-2/episodio-10-who-is-alive" },
  { rank: 3, series: "The Last of Us", episode: '"Long Long Time"', code: "T01 · E03", debating: 18, comments: 97, href: "/series/the-last-of-us-100088/temporada-1/episodio-3-long-long-time" },
  { rank: 4, series: "Battlestar Galactica", episode: '"Pegasus"', code: "T02 · E10", debating: 12, comments: 74, href: "/series/battlestar-galactica-1972/temporada-2/episodio-10-pegasus" },
];

const mySeriesEpisodes = [
  { rank: 1, series: "Battlestar Galactica", episode: '"Pegasus"', code: "T02 · E10", debating: 12, comments: 74, href: "/series/battlestar-galactica-1972/temporada-2/episodio-10-pegasus" },
  { rank: 2, series: "Breaking Bad", episode: '"Face Off"', code: "T04 · E13", debating: 9, comments: 51, href: "/series/breaking-bad-1396/temporada-4/episodio-13-face-off" },
];

const tabs = ["Episódios quentes", "Nas suas séries"];

export const HotEpisodes = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();

  const episodes = activeTab === 1 ? mySeriesEpisodes : hotEpisodes;

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

      {/* Cards */}
      {(activeTab === 0 || user) && (
        <div className="flex flex-col gap-3">
          {episodes.map((ep, idx) => {
            const isFirst = idx === 0;
            return (
              <Link
                key={ep.rank}
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
                    <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${isFirst ? "text-black/60" : "text-[var(--text-muted)]"}`}>
                      {ep.code}
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${isFirst ? "bg-black/40" : "bg-green-500"}`} />
                      {ep.debating} agora
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
      )}
    </section>
  );
};

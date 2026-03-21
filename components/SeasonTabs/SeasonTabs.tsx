"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { seasonSlug, episodeSlug } from "@/lib/slugs";
import { createClient } from "@/lib/supabase-browser";

interface Episode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
  air_date: string | null;
  vote_average: number;
}

interface Season {
  season_number: number;
  name: string;
  episodes: Episode[];
}

interface Props {
  slug: string;
  seriesId: string;
  seasons: Season[];
}

const REACTIONS = [
  { key: "chocante",      emoji: "😱", weight: 9.5 },
  { key: "incrivel",      emoji: "🔥", weight: 9.0 },
  { key: "emocionante",   emoji: "💗", weight: 8.0 },
  { key: "surpreso",      emoji: "😮", weight: 6.5 },
  { key: "mediano",       emoji: "😐", weight: 5.0 },
  { key: "decepcionante", emoji: "😞", weight: 2.0 },
];

type EpisodeStats = {
  score: number;
  topEmoji: string | null;
  total: number;
};

function epId(seriesId: string, season: number, ep: number) {
  return `${seriesId}-s${season}-e${ep}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00")
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    .replace(/\s+de\s+/g, " ");
}

export function SeasonTabs({ slug, seriesId, seasons }: Props) {
  const [selected, setSelected] = useState(seasons[0]?.season_number ?? 1);
  const [stats, setStats] = useState<Record<string, EpisodeStats>>({});

  const current = seasons.find((s) => s.season_number === selected);
  const useTabs = seasons.length <= 6;

  useEffect(() => {
    if (!current) return;

    const ids = current.episodes.map((ep) => epId(seriesId, selected, ep.episode_number));
    if (ids.length === 0) return;

    const supabase = createClient();
    supabase
      .from("episode_reactions")
      .select("episode_id, reaction_key")
      .in("episode_id", ids)
      .then(({ data }) => {
        if (!data) return;

        // Aggregate counts per episode
        const byEp: Record<string, Record<string, number>> = {};
        for (const row of data) {
          if (!byEp[row.episode_id]) byEp[row.episode_id] = {};
          byEp[row.episode_id][row.reaction_key] = (byEp[row.episode_id][row.reaction_key] ?? 0) + 1;
        }

        const newStats: Record<string, EpisodeStats> = {};
        for (const id of ids) {
          const counts = byEp[id] ?? {};
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          if (total === 0) continue;

          const score = REACTIONS.reduce((acc, r) => acc + r.weight * (counts[r.key] ?? 0), 0) / total;
          const topKey = REACTIONS.reduce((best, r) =>
            (counts[r.key] ?? 0) > (counts[best.key] ?? 0) ? r : best
          , REACTIONS[0]).key;
          const topEmoji = REACTIONS.find((r) => r.key === topKey && (counts[r.key] ?? 0) > 0)?.emoji ?? null;

          newStats[id] = { score, topEmoji, total };
        }
        setStats(newStats);
      });
  }, [selected, seriesId, current]);

  return (
    <div className="flex flex-col gap-4">
      {/* Season selector */}
      {useTabs ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {seasons.map((s) => (
            <button
              key={s.season_number}
              onClick={() => setSelected(s.season_number)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selected === s.season_number
                  ? "bg-[var(--yellow-muted)] border-[var(--yellow)] text-[var(--yellow)]"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
              }`}
            >
              T{s.season_number}
            </button>
          ))}
        </div>
      ) : (
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--yellow)] transition-colors"
        >
          {seasons.map((s) => (
            <option key={s.season_number} value={s.season_number}>
              {s.name} ({s.episodes.length} ep.)
            </option>
          ))}
        </select>
      )}

      <hr className="border-[var(--border)]" />

      {/* Episode count label */}
      {current && (
        <p className="text-xs text-[var(--text-muted)]">
          {current.episodes.length} episódio{current.episodes.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Episodes list */}
      {current && (
        <div className="flex flex-col">
          {current.episodes.map((ep, i) => {
            const id = epId(seriesId, selected, ep.episode_number);
            const epStats = stats[id];

            return (
              <Link
                key={ep.id}
                href={`/series/${slug}/${seasonSlug(selected)}/${episodeSlug(ep.episode_number, ep.name)}`}
                className={`flex gap-3 py-3 hover:bg-[var(--bg-surface)] -mx-4 px-4 transition-colors group ${
                  i < current.episodes.length - 1 ? "border-b border-[var(--border)]" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-28 h-[63px] rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
                  {ep.still_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                      alt={ep.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-xs">
                      E{ep.episode_number}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 justify-center">
                  {/* Episode number + title + reaction score */}
                  <div className="flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] shrink-0">
                        E{String(ep.episode_number).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--yellow)] transition-colors">
                        {ep.name}
                      </p>
                    </div>
                    {/* Score + top emoji — only if has reactions */}
                    {epStats && epStats.total > 0 && (
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {epStats.topEmoji && (
                          <span className="text-sm leading-none">{epStats.topEmoji}</span>
                        )}
                        <span className="text-xs font-bold text-[var(--yellow)]">
                          {epStats.score.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Runtime + air date */}
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {ep.runtime ? `${ep.runtime} min` : ""}
                    {ep.runtime && ep.air_date ? " · " : ""}
                    {ep.air_date ? formatDate(ep.air_date) : ""}
                  </p>

                  {/* Overview — desktop only */}
                  {ep.overview && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed hidden sm:block">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

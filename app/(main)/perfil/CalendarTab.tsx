"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { FaShareNodes } from "react-icons/fa6";

interface WatchedEp {
  epId: string;
  watchedAt: string;
  seriesName: string;
  episodeName: string;
  seasonNumber: number;
  episodeNumber: number;
  still_path: string | null;
  poster_path: string | null;
  href: string;
}

interface NextEp {
  seriesId: number;
  seriesName: string;
  poster_path: string | null;
  seriesHref: string;
  episodeName: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string | null;
  isUpcoming: boolean;
  still_path: string | null;
  href: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  });
}

function relativeDate(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return "há pouco";
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `há ${Math.floor(diff / 86400)}d`;
  return formatDate(dateStr);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

async function shareEpisode(seriesName: string, episodeName: string, href: string) {
  const url = window.location.origin + href;
  const text = `Estou assistindo "${episodeName}" de ${seriesName} na Segunda Temporada 📺`;
  if (navigator.share) {
    await navigator.share({ title: "Segunda Temporada", text, url }).catch(() => {});
  } else {
    await navigator.clipboard.writeText(`${text}\n${url}`);
  }
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
      ))}
    </div>
  );
}

export function CalendarTab() {
  const { data: watched = [], isLoading: watchedLoading } = useQuery<WatchedEp[]>({
    queryKey: ["profile-watched"],
    queryFn: () => fetch("/api/profile/watched").then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const { data: nextEps = [], isLoading: nextLoading } = useQuery<NextEp[]>({
    queryKey: ["profile-next-episodes"],
    queryFn: () => fetch("/api/profile/next-episodes").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const upcoming = nextEps.filter((e) => e.isUpcoming);
  const readyToWatch = nextEps.filter((e) => !e.isUpcoming);

  return (
    <div className="flex flex-col gap-6 pb-28">

      {/* Próximos — em breve */}
      {(nextLoading || upcoming.length > 0) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Em breve</p>
          {nextLoading ? <Skeleton /> : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {upcoming.map((ep, idx) => (
                <div
                  key={ep.seriesId}
                  className={`flex items-center gap-3 px-4 py-3.5 ${idx < upcoming.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 relative bg-[var(--bg-elevated)]">
                    {ep.poster_path && (
                      <Image src={`https://image.tmdb.org/t/p/w92${ep.poster_path}`} alt={ep.seriesName} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] truncate">{ep.seriesName}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">&ldquo;{ep.episodeName}&rdquo;</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.seasonNumber).padStart(2, "0")} · E{String(ep.episodeNumber).padStart(2, "0")}
                      {ep.airDate && ` · ${daysUntil(ep.airDate)}`}
                    </p>
                  </div>
                  {ep.airDate && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-[var(--yellow)]">{formatDate(ep.airDate)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Próximos — prontos para assistir */}
      {(nextLoading || readyToWatch.length > 0) && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Continuar assistindo</p>
          {nextLoading ? <Skeleton /> : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              {readyToWatch.map((ep, idx) => (
                <Link
                  key={ep.seriesId}
                  href={ep.href}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors ${idx < readyToWatch.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 relative bg-[var(--bg-elevated)]">
                    {ep.poster_path && (
                      <Image src={`https://image.tmdb.org/t/p/w92${ep.poster_path}`} alt={ep.seriesName} fill className="object-cover" sizes="40px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] truncate">{ep.seriesName}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">&ldquo;{ep.episodeName}&rdquo;</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.seasonNumber).padStart(2, "0")} · E{String(ep.episodeNumber).padStart(2, "0")}
                    </p>
                  </div>
                  <span className="text-[var(--text-muted)] text-sm shrink-0">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!nextLoading && nextEps.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-muted)]">Favorite séries para ver seus próximos episódios aqui.</p>
        </div>
      )}

      {/* Histórico */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Histórico</p>
        {watchedLoading ? <Skeleton /> : watched.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Nenhum episódio assistido ainda.</p>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {watched.map((ep, idx) => (
              <div
                key={ep.epId}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx < watched.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <Link href={ep.href} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <div className="w-16 h-9 rounded-lg overflow-hidden shrink-0 relative bg-[var(--bg-elevated)]">
                    {ep.still_path && (
                      <Image src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.episodeName} fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] truncate">{ep.seriesName}</p>
                    <p className="text-sm text-[var(--text-primary)] truncate">&ldquo;{ep.episodeName}&rdquo;</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      T{String(ep.seasonNumber).padStart(2, "0")} · E{String(ep.episodeNumber).padStart(2, "0")} · {relativeDate(ep.watchedAt)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => shareEpisode(ep.seriesName, ep.episodeName, ep.href)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--yellow)] hover:bg-[var(--bg-elevated)] transition-colors"
                  title="Compartilhar"
                >
                  <FaShareNodes size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

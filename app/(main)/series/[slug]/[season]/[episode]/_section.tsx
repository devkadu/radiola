"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { EpisodeComments } from "@/components/EpisodeComments/EpisodeComments";
import { InlineCommentInput } from "./_components";
import { useAuth } from "@/context/AuthContext";
import { watchedEpisodesService } from "@/services/watchedEpisodes";
import { episodeId as makeEpisodeId } from "@/services/comments";

interface CrewMember {
  name: string;
  job: string;
  profile_path: string | null;
}

interface CastMember {
  name: string;
  character: string;
  profile_path: string | null;
}

interface FichaTecnica {
  airDate: string | null;
  runtime: number | null;
  productionCode: string | null;
  crew: CrewMember[];
  guestStars: CastMember[];
}

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  placeholder: string;
  episodeTitle?: string;
  episodeUrl?: string;
  fichaTecnica: FichaTecnica;
}

export function EpisodeCommentsSection({
  seriesId,
  seasonNumber,
  episodeNumber,
  placeholder,
  episodeTitle,
  episodeUrl,
  fichaTecnica,
}: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "ficha">("comments");
  const { user, loading: authLoading } = useAuth();
  const [watched, setWatched] = useState<boolean | null>(null);

  const epId = makeEpisodeId(seriesId, seasonNumber, episodeNumber);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setWatched(false); return; }
    watchedEpisodesService.isWatched(user.id, epId).then(setWatched);
  }, [user, authLoading, epId]);

  const handleMarkWatched = async () => {
    if (user) await watchedEpisodesService.markWatched(user.id, epId);
    setWatched(true);
  };

  const director = fichaTecnica.crew.find((c) => c.job === "Director");
  const writers = fichaTecnica.crew.filter((c) => ["Writer", "Story", "Screenplay"].includes(c.job));

  const fichaContent = (
    <div className="flex flex-col gap-5 py-2">
      {(director || writers.length > 0) && (
        <div className="flex flex-col gap-3">
          {director && (
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Direção</p>
              <p className="text-sm text-[var(--text-primary)]">{director.name}</p>
            </div>
          )}
          {writers.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Roteiro</p>
              <p className="text-sm text-[var(--text-primary)]">{writers.map((w) => w.name).join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {fichaTecnica.guestStars.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Participações especiais</p>
          <div className="flex flex-col gap-2">
            {fichaTecnica.guestStars.slice(0, 8).map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[var(--bg-elevated)] relative">
                  {g.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${g.profile_path}`}
                      alt={g.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                      {g.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{g.name}</p>
                  {g.character && (
                    <p className="text-xs text-[var(--text-muted)] truncate">{g.character}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!director && writers.length === 0 && fichaTecnica.guestStars.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          Sem informações técnicas disponíveis.
        </p>
      )}
    </div>
  );

  const commentsContent = (
    watched === null ? (
      <div className="h-24 bg-[var(--bg-elevated)] animate-pulse rounded-xl" />
    ) : watched ? (
      <div className="flex flex-col gap-3">
        <InlineCommentInput
          episodeId={epId}
          placeholder={placeholder}
          onCommentAdded={() => setRefreshKey((k) => k + 1)}
        />
        <EpisodeComments
          seriesId={seriesId}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          episodeTitle={episodeTitle}
          episodeUrl={episodeUrl}
          refreshKey={refreshKey}
        />
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] mb-1">Spoiler Lock</p>
          <p className="text-sm text-[var(--text-secondary)]">Confirme que assistiu para liberar a discussão</p>
        </div>
        <button
          onClick={handleMarkWatched}
          className="text-sm px-5 py-2.5 rounded-full bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
        >
          Já assisti — liberar
        </button>
      </div>
    )
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "comments"
              ? "border-[var(--yellow)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2.5h10a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H8L5 12V9.5H2a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          Comentários
        </button>
        <button
          onClick={() => setActiveTab("ficha")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
            activeTab === "ficha"
              ? "border-[var(--yellow)] text-[var(--text-primary)]"
              : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Ficha técnica
        </button>
      </div>

      {/* Content */}
      <div className="pt-4 px-4 lg:px-4 flex-1">
        {activeTab === "ficha" ? fichaContent : commentsContent}
      </div>
    </div>
  );
}

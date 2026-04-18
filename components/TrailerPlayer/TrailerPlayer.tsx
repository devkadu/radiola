"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaTrash } from "react-icons/fa6";
import type { TrailerComment } from "@/services/trailerComments";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function UserAvatar({ avatarUrl, username, size = 28 }: { avatarUrl: string | null; username: string; size?: number }) {
  const initials = username.slice(0, 2).toUpperCase();
  const colors = ["#4f46e5", "#16a34a", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];
  const color = colors[username.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-[10px] font-bold text-white"
      style={{ width: size, height: size, backgroundColor: avatarUrl ? undefined : color }}
    >
      {avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        : initials}
    </div>
  );
}

interface Props {
  youtubeKey: string;
  seriesId: string;
}

export function TrailerPlayer({ youtubeKey, seriesId }: Props) {
  const { user } = useAuth();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playerReady, setPlayerReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [, setPaused] = useState(true);

  const [comments, setComments] = useState<TrailerComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Comentário sendo composto
  const [composing, setComposing] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftTimestamp, setDraftTimestamp] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Comentários próximos ao segundo atual (±3s)

  const username = user?.user_metadata?.username || user?.email?.split("@")[0] || "";
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  // Carrega comentários
  useEffect(() => {
    fetch(`/api/trailer-comments?series_id=${seriesId}&youtube_key=${youtubeKey}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setLoadingComments(false);
      })
      .catch(() => setLoadingComments(false));
  }, [seriesId, youtubeKey]);

  // Inicializa YouTube IFrame API
  useEffect(() => {
    const playerId = `yt-player-${youtubeKey}`;

    function createPlayer() {
      playerRef.current = new window.YT.Player(playerId, {
        videoId: youtubeKey,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: (e: any) => {
            setPlayerReady(true);
            setDuration(e.target.getDuration());
          },
          onStateChange: (e: any) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setPaused(!playing);
            if (playing) {
              intervalRef.current = setInterval(() => {
                const t = playerRef.current?.getCurrentTime?.() ?? 0;
                setCurrentTime(t);
              }, 500);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          },
        },
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeKey]);

  // Dots no timeline: agrupa por segundo
  const dotsBySecond = comments.reduce<Record<number, number>>((acc, c) => {
    acc[c.timestamp_sec] = (acc[c.timestamp_sec] ?? 0) + 1;
    return acc;
  }, {});

  // Comentários próximos ao currentTime
  const nearbyComments = comments.filter(
    (c) => Math.abs(c.timestamp_sec - currentTime) <= 3
  );

  const seekTo = useCallback((sec: number) => {
    playerRef.current?.seekTo?.(sec, true);
    setCurrentTime(sec);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  };

  const handleCommentHere = () => {
    if (!user) return;
    playerRef.current?.pauseVideo?.();
    setDraftTimestamp(Math.floor(currentTime));
    setDraftText("");
    setComposing(true);
  };

  const handleSubmit = async () => {
    if (!draftText.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/trailer-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          series_id: seriesId,
          youtube_key: youtubeKey,
          timestamp_sec: draftTimestamp,
          text: draftText.trim(),
        }),
      });
      if (!res.ok) throw new Error("erro ao enviar");
      const created: TrailerComment = await res.json();
      setComments((prev) =>
        [...prev, created].sort((a, b) => a.timestamp_sec - b.timestamp_sec)
      );
      setComposing(false);
      setDraftText("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/trailer-comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Player */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <div id={`yt-player-${youtubeKey}`} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Timeline customizada com dots */}
      {playerReady && duration > 0 && (
        <div className="flex flex-col gap-1.5">
          <div
            ref={containerRef}
            className="relative h-6 flex items-center cursor-pointer group"
            onClick={handleTimelineClick}
          >
            {/* Trilha */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--bg-elevated)]">
              {/* Progresso */}
              <div
                className="h-full rounded-full bg-[var(--yellow)] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Dots de comentários */}
            {Object.entries(dotsBySecond).map(([sec, count]) => {
              const pct = (Number(sec) / duration) * 100;
              return (
                <button
                  key={sec}
                  title={`${count} comentário${count > 1 ? "s" : ""} em ${formatTime(Number(sec))}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(Number(sec));
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                  style={{ left: `${pct}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[var(--yellow)] border-2 border-black flex items-center justify-center hover:scale-150 transition-transform">
                    {count > 1 && (
                      <span className="absolute -top-4 text-[9px] text-[var(--yellow)] font-bold">{count}</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow z-20 pointer-events-none"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          {/* Tempo + botão comentar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {user ? (
              <button
                onClick={handleCommentHere}
                className="text-xs px-3 py-1 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)] font-semibold hover:bg-[var(--yellow)] hover:text-black transition-colors"
              >
                + Comentar aqui ({formatTime(currentTime)})
              </button>
            ) : (
              <Link
                href="/login"
                className="text-xs text-[var(--text-muted)] hover:text-[var(--yellow)] transition-colors"
              >
                Entre para comentar
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Form de composição */}
      {composing && user && (
        <div className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--yellow)]">
          <p className="text-xs text-[var(--yellow)] font-semibold">
            Comentando em {formatTime(draftTimestamp)}
          </p>
          <div className="flex gap-2">
            <UserAvatar avatarUrl={avatarUrl} username={username} />
            <textarea
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="O que você notou neste momento?"
              rows={2}
              maxLength={500}
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--yellow)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-3 py-2 outline-none resize-none transition-colors"
            />
          </div>
          <div className="flex gap-2 justify-end items-center">
            <span className="text-[10px] text-[var(--text-muted)]">{draftText.length}/500</span>
            <button
              onClick={() => setComposing(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!draftText.trim() || submitting}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--yellow)] text-black font-bold disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
            >
              {submitting ? "Enviando..." : "Publicar"}
            </button>
          </div>
        </div>
      )}

      {/* Comentários próximos ao segundo atual */}
      {nearbyComments.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
            Agora em cena
          </p>
          {nearbyComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--yellow-muted)] border border-[var(--yellow)]/30">
              <button
                onClick={() => seekTo(c.timestamp_sec)}
                className="shrink-0 text-[10px] font-bold text-[var(--yellow)] bg-black/30 px-1.5 py-0.5 rounded tabular-nums hover:bg-black/50 transition-colors"
              >
                {formatTime(c.timestamp_sec)}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{c.text}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">@{c.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista completa de comentários */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {loadingComments ? "..." : `${comments.length} anotaç${comments.length !== 1 ? "ões" : "ão"} no trailer`}
          </p>
        </div>

        {!loadingComments && comments.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            Pause em qualquer momento e deixe sua observação.
          </p>
        )}

        {comments.map((c) => (
          <div
            key={c.id}
            className={`flex items-start gap-2.5 py-3 border-b border-[var(--border)] last:border-0 ${
              Math.abs(c.timestamp_sec - currentTime) <= 3 ? "opacity-100" : "opacity-70 hover:opacity-100"
            } transition-opacity`}
          >
            <button
              onClick={() => seekTo(c.timestamp_sec)}
              className="shrink-0 text-[10px] font-bold text-[var(--yellow)] bg-[var(--yellow-muted)] border border-[var(--yellow)]/40 px-1.5 py-0.5 rounded tabular-nums hover:bg-[var(--yellow)] hover:text-black transition-colors mt-0.5"
            >
              {formatTime(c.timestamp_sec)}
            </button>
            <Link href={`/u/${c.username}`} className="shrink-0 hover:opacity-80 transition-opacity">
              <UserAvatar
                avatarUrl={c.user_id === user?.id ? (user.user_metadata?.avatar_url ?? c.avatar_url) : c.avatar_url}
                username={c.username}
              />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">{c.username}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">{relativeTime(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <FaTrash size={9} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

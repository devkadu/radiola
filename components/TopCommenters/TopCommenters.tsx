"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

interface Commenter {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  comments: number;
}

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const colors = ["#4f46e5", "#16a34a", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];

function Avatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  const initials = username.slice(0, 2).toUpperCase();
  const color = colors[username.charCodeAt(0) % colors.length];

  return (
    <div
      className="w-12 h-12 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-sm font-bold text-white"
      style={{ backgroundColor: avatarUrl ? undefined : color }}
    >
      {avatarUrl
        ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="48px" />
        : initials}
    </div>
  );
}

export const TopCommenters = () => {
  const { data: commenters = [], isLoading: loading } = useQuery<Commenter[]>({
    queryKey: ["top-commenters"],
    queryFn: () => fetch("/api/top-commenters").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="px-4 lg:px-0 py-6 pb-28 lg:pb-10">
      <div className="mb-1">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Top da semana</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Quem mais está movimentando os debates
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && commenters.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] mt-4">
          Nenhum comentário esta semana ainda. Seja o primeiro!
        </p>
      )}

      {!loading && commenters.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {commenters.map((c) => (
            <Link
              key={c.user_id}
              href={`/u/${c.username}`}
              className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-[var(--yellow)] transition-colors"
            >
              <p className="text-xs text-[var(--text-muted)] self-start">
                {medals[c.rank] ?? `${c.rank}º`}
              </p>
              <Avatar username={c.username} avatarUrl={c.avatar_url} />
              <p className="text-sm text-[var(--text-primary)] font-medium text-center truncate w-full">
                {c.username}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{c.comments} comentário{c.comments !== 1 ? "s" : ""}</p>
              {c.rank === 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--yellow)] text-[var(--yellow)]">
                  em alta
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

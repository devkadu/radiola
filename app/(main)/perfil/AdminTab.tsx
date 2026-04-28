"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface Stats {
  users: number;
  comments: number;
  articles: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
}

interface Report {
  id: string;
  reason: string;
  created_at: string;
  comment_id: string;
  comments: { content: string; episode_id: string } | null;
}

const statusColor: Record<string, string> = {
  draft: "text-[var(--text-muted)]",
  published: "text-emerald-400",
  archived: "text-[var(--text-muted)]",
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export function AdminTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const sb = createClient();

    Promise.all([
      sb.from("profiles").select("*", { count: "exact", head: true }),
      sb.from("comments").select("*", { count: "exact", head: true }),
      sb.from("articles").select("*", { count: "exact", head: true }),
    ]).then(([u, c, a]) => setStats({ users: u.count ?? 0, comments: c.count ?? 0, articles: a.count ?? 0 }));

    sb.from("articles")
      .select("id, title, slug, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setArticles(data ?? []));

    sb.from("moderation_queue")
      .select("id, reason, created_at, comment_id, comments(content, episode_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data }) => setReports((data as any) ?? []));
  }, []);

  const dismissReport = async (reportId: string, commentId: string, action: "dismiss" | "delete") => {
    await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, commentId, action }),
    });
    setReports((r) => r.filter((x) => x.id !== reportId));
  };

  return (
    <div className="px-4 flex flex-col gap-4 pb-10">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Usuários", value: stats.users },
            { label: "Comentários", value: stats.comments },
            { label: "Artigos", value: stats.articles },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Artigos */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Artigos</p>
          <Link href="/admin/artigos/novo" className="text-xs text-[var(--yellow)] hover:underline">+ Novo</Link>
        </div>
        {articles.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">Nenhum artigo.</p>
        ) : (
          articles.map((a, i) => (
            <div key={a.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${i < articles.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-primary)] font-medium truncate">{a.title}</p>
                <p className={`text-[10px] mt-0.5 ${statusColor[a.status]}`}>{statusLabel[a.status]}</p>
              </div>
              <Link href={`/admin/artigos/${a.id}`} className="shrink-0 text-xs text-[var(--yellow)] hover:underline">Editar</Link>
            </div>
          ))
        )}
      </div>

      {/* Moderação */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Moderação</p>
          {reports.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-950 text-red-400 font-bold">{reports.length}</span>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">Nenhuma denúncia pendente.</p>
        ) : (
          reports.map((r, i) => (
            <div key={r.id} className={`px-4 py-3 flex items-start gap-3 ${i < reports.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--text-primary)] line-clamp-2 leading-snug">{r.comments?.content ?? "—"}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Motivo: {r.reason}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => dismissReport(r.id, r.comment_id, "dismiss")} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Ignorar</button>
                <button onClick={() => dismissReport(r.id, r.comment_id, "delete")} className="text-[10px] text-red-400 hover:text-red-300">Deletar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

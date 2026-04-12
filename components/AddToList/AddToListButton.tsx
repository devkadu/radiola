"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaListUl } from "react-icons/fa6";

interface UserList {
  id: string;
  name: string;
  series_count: number;
}

interface Props {
  seriesId: number;
  seriesName: string;
  posterPath: string | null;
  seriesSlug: string;
}

export function AddToListButton({ seriesId, seriesName, posterPath, seriesSlug }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [inLists, setInLists] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const { data: lists = [], isLoading } = useQuery<UserList[]>({
    queryKey: ["user-lists"],
    queryFn: () => fetch("/api/lists").then((r) => (r.ok ? r.json() : [])),
    staleTime: 30_000,
    retry: false,
  });

  // Verifica em quais listas a série já está
  useEffect(() => {
    if (!open || lists.length === 0) return;
    const check = async () => {
      const results = await Promise.all(
        lists.map((l) =>
          fetch(`/api/lists/${l.id}`)
            .then((r) => r.json())
            .then((d) => ({ id: l.id, has: d.series?.some((s: any) => s.series_id === seriesId) }))
        )
      );
      setInLists(new Set(results.filter((r) => r.has).map((r) => r.id)));
    };
    check();
  }, [open, lists, seriesId]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addMutation = useMutation({
    mutationFn: (listId: string) =>
      fetch(`/api/lists/${listId}/series`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series_id: seriesId, series_name: seriesName, poster_path: posterPath, series_slug: seriesSlug }),
      }),
    onSuccess: (_, listId) => {
      setInLists((prev) => new Set([...prev, listId]));
      qc.invalidateQueries({ queryKey: ["user-lists"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (listId: string) =>
      fetch(`/api/lists/${listId}/series/${seriesId}`, { method: "DELETE" }),
    onSuccess: (_, listId) => {
      setInLists((prev) => { const s = new Set(prev); s.delete(listId); return s; });
      qc.invalidateQueries({ queryKey: ["user-lists"] });
    },
  });

  const toggle = (listId: string) => {
    if (inLists.has(listId)) {
      removeMutation.mutate(listId);
    } else {
      addMutation.mutate(listId);
    }
  };

  // Não renderiza se não há listas (usuário não logado ou sem listas)
  if (!isLoading && lists.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
          open
            ? "bg-[var(--yellow)] text-black border-[var(--yellow)]"
            : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
        }`}
        aria-label="Adicionar a uma lista"
      >
        <FaListUl size={12} />
        Listas
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 min-w-[200px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
          {isLoading && (
            <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Carregando…</div>
          )}
          {!isLoading && lists.map((list) => {
            const active = inLists.has(list.id);
            const pending = addMutation.isPending && addMutation.variables === list.id
              || removeMutation.isPending && removeMutation.variables === list.id;
            return (
              <button
                key={list.id}
                onClick={() => toggle(list.id)}
                disabled={pending}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-[var(--border)] last:border-0 ${
                  active
                    ? "bg-[var(--yellow)]/10 text-[var(--yellow)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                } disabled:opacity-50`}
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-bold shrink-0 transition-colors ${
                  active ? "bg-[var(--yellow)] border-[var(--yellow)] text-black" : "border-[var(--border)]"
                }`}>
                  {active && "✓"}
                </span>
                <span className="flex-1 truncate font-medium">{list.name}</span>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">{list.series_count}</span>
              </button>
            );
          })}
          <div className="px-4 py-2 border-t border-[var(--border)]">
            <a href="/perfil" className="text-[10px] text-[var(--text-muted)] hover:text-[var(--yellow)] transition-colors">
              Gerenciar listas →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

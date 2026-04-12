"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaLock, FaGlobe } from "react-icons/fa6";

interface UserList {
  id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  series_count: number;
}

interface ListWithSeries extends UserList {
  series: {
    series_id: number;
    series_name: string;
    poster_path: string | null;
    series_slug: string;
    added_at: string;
  }[];
}

const MAX_LISTS = 3;

export function UserLists() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<ListWithSeries | null>(null);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: lists = [], isLoading } = useQuery<UserList[]>({
    queryKey: ["user-lists"],
    queryFn: () => fetch("/api/lists").then((r) => r.json()),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }).then(async (r) => {
        if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-lists"] });
      setNewName("");
      setCreating(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/lists/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["user-lists"] });
      if (expandedId === id) { setExpandedId(null); setExpandedData(null); }
      setDeleteConfirm(null);
    },
  });

  const removeSeriesMutation = useMutation({
    mutationFn: ({ listId, seriesId }: { listId: string; seriesId: number }) =>
      fetch(`/api/lists/${listId}/series/${seriesId}`, { method: "DELETE" }),
    onSuccess: (_, { listId }) => {
      qc.invalidateQueries({ queryKey: ["user-lists"] });
      // Refetch expanded list
      if (expandedId === listId) expandList(listId);
    },
  });

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(name);
  };

  const expandList = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setExpandedData(null); return; }
    setExpandedId(id);
    setExpandedData(null);
    setLoadingExpand(true);
    try {
      const data = await fetch(`/api/lists/${id}`).then((r) => r.json());
      setExpandedData(data);
    } finally {
      setLoadingExpand(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="h-4 w-24 rounded bg-[var(--bg-elevated)] animate-pulse mb-3" />
        <div className="h-10 w-full rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Minhas listas
          <span className="ml-2 text-[var(--text-muted)] normal-case font-normal tracking-normal text-[10px]">
            {lists.length}/{MAX_LISTS}
          </span>
        </p>
        {lists.length < MAX_LISTS && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-[var(--yellow)] hover:opacity-80 transition-opacity"
          >
            <FaPlus size={9} /> Nova lista
          </button>
        )}
      </div>

      {/* Formulário de criação */}
      {creating && (
        <div className="mb-4 flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
            placeholder="Nome da lista…"
            maxLength={50}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--yellow)] transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || createMutation.isPending}
            className="px-3 py-2 rounded-xl bg-[var(--yellow)] text-black text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {createMutation.isPending ? "…" : "Criar"}
          </button>
          <button
            onClick={() => { setCreating(false); setNewName(""); }}
            className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)] transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      {createMutation.isError && (
        <p className="text-xs text-red-400 mb-3">{(createMutation.error as Error).message}</p>
      )}

      {/* Lista vazia */}
      {lists.length === 0 && !creating && (
        <p className="text-sm text-[var(--text-muted)] text-center py-4">
          Crie sua primeira lista para organizar séries
        </p>
      )}

      {/* Listas */}
      <div className="flex flex-col gap-2">
        {lists.map((list) => (
          <div key={list.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Cabeçalho da lista */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button
                onClick={() => expandList(list.id)}
                className="flex-1 flex items-center gap-2.5 text-left min-w-0"
              >
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate flex-1">
                  {list.name}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {list.series_count} {list.series_count === 1 ? "série" : "séries"}
                </span>
                {list.is_public
                  ? <FaGlobe size={10} className="text-green-400 shrink-0" />
                  : <FaLock size={10} className="text-[var(--text-muted)] shrink-0" />
                }
                {expandedId === list.id
                  ? <FaChevronUp size={10} className="text-[var(--text-muted)] shrink-0" />
                  : <FaChevronDown size={10} className="text-[var(--text-muted)] shrink-0" />
                }
              </button>

              {/* Deletar */}
              {deleteConfirm === list.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => deleteMutation.mutate(list.id)}
                    disabled={deleteMutation.isPending}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 px-1"
                  >
                    {deleteMutation.isPending ? "…" : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(list.id); }}
                  className="shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-colors p-1"
                  aria-label="Excluir lista"
                >
                  <FaTrash size={11} />
                </button>
              )}
            </div>

            {/* Conteúdo expandido */}
            {expandedId === list.id && (
              <div className="border-t border-[var(--border)] px-3 py-3 bg-[var(--bg-elevated)]/40">
                {loadingExpand && (
                  <div className="flex gap-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="w-14 aspect-[2/3] rounded-lg bg-[var(--bg-elevated)] animate-pulse" />
                    ))}
                  </div>
                )}

                {!loadingExpand && expandedData && expandedData.series.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-2">
                    Nenhuma série ainda — adicione pela página da série
                  </p>
                )}

                {!loadingExpand && expandedData && expandedData.series.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {expandedData.series.map((s) => (
                      <div key={s.series_id} className="relative group">
                        <Link href={`/series/${s.series_slug}`}>
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[var(--bg-elevated)]">
                            {s.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                                alt={s.series_name}
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">📺</div>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] truncate mt-1 leading-tight">
                            {s.series_name}
                          </p>
                        </Link>
                        {/* Botão remover */}
                        <button
                          onClick={() => removeSeriesMutation.mutate({ listId: list.id, seriesId: s.series_id })}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] hover:bg-red-700"
                          aria-label="Remover da lista"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

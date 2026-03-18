"use client";
import { useState } from "react";

interface Props {
  placeholder?: string;
}

export const CommentBox = ({ placeholder }: Props) => {
  const [text, setText] = useState("");

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-surface)]">
      <p className="text-xs font-semibold tracking-widest text-[var(--text-muted)] px-4 pt-4 pb-2 uppercase">
        Deixe sua opinião sobre o episódio
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Sem medo — aqui só quem chegou até aqui..."}
        rows={4}
        className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] px-4 pb-3 outline-none resize-none"
      />
      <div className="flex justify-end gap-3 px-4 pb-4">
        <button
          onClick={() => setText("")}
          className="px-5 py-2 rounded-full text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={!text.trim()}
          className="px-5 py-2 rounded-full text-sm font-bold bg-[var(--yellow)] text-black disabled:opacity-30 hover:bg-[var(--yellow-dim)] transition-colors"
        >
          Publicar
        </button>
      </div>
    </div>
  );
};

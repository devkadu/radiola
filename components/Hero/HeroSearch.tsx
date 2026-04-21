"use client";

import { useSearchOverlay } from "@/context/SearchContext";
import { FiSearch } from "react-icons/fi";

const TAGS = [
  { label: "parecida com Dark",    query: "parecida com Dark" },
  { label: "curta pra maratonar",  query: "curta pra maratonar" },
  { label: "One Piece",            query: "One Piece" },
  { label: "onde continuar Silo",  query: "onde continuar Silo" },
  { label: "novidades The Boys",   query: "novidades The Boys" },
];

export function HeroSearch() {
  const { open } = useSearchOverlay();

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => open()}
        className="flex items-center gap-2 w-full max-w-sm px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--yellow)]/40 transition-colors text-left"
      >
        <FiSearch size={15} className="shrink-0" />
        buscar série, humor, gênero…
      </button>

      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <button
            key={tag.label}
            onClick={() => open(tag.query)}
            className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-xs text-[var(--text-muted)] hover:border-[var(--yellow)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}

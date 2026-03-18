"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { GENRES } from "@/lib/genres";

export const GenreTags = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("genre");

  const handleSelect = (id: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("genre", id.toString());
    } else {
      params.delete("genre");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <section className="px-4 pb-6">
      <h3 className="text-base font-semibold mb-3 text-[var(--text-primary)]">Gêneros</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map((genre) => {
          const active = genre.id === null ? !selectedId : selectedId === String(genre.id);
          return (
            <button
              key={genre.label}
              onClick={() => handleSelect(genre.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-[var(--yellow)] text-black border-[var(--yellow)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
              }`}
            >
              {genre.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

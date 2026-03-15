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
      <h3 className="text-base font-semibold mb-3">Gêneros</h3>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map((genre) => {
          const active = genre.id === null ? !selectedId : selectedId === String(genre.id);
          return (
            <button
              key={genre.label}
              onClick={() => handleSelect(genre.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? "bg-[var(--brand-yellow)] text-black border-[var(--brand-yellow)]"
                  : "border-[var(--border-muted)] text-[var(--foreground)] hover:border-gray-500"
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

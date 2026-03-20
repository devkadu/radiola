"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton/FavoriteButton";

interface Props {
  series: {
    id: number;
    name: string;
    slug: string;
    poster_path: string | null;
  };
}

export const SeriesTopBar = ({ series }: Props) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between py-3 bg-[var(--bg)]/80 backdrop-blur-sm -mx-4 px-4 mb-6">
      <Link
        href="/"
        className="w-10 h-10 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--yellow)] transition-colors shrink-0"
      >
        <span className="text-lg leading-none">←</span>
      </Link>

      <p
        className={`text-sm font-semibold text-[var(--text-primary)] truncate mx-4 transition-all duration-300 ${
          scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
      >
        {series.name}
      </p>

      <FavoriteButton series={series} />
    </div>
  );
};

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
  heroHeight?: number;
}

export const SeriesTopBar = ({ series, heroHeight = 200 }: Props) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > heroHeight);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [heroHeight]);

  return (
    <>
      {/* Overlay on hero — always visible at top */}
      <div className="flex items-center justify-between py-3 px-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors shrink-0"
        >
          <span className="text-lg leading-none text-white">←</span>
        </Link>
        <FavoriteButton series={series} />
      </div>

      {/* Sticky bar — appears after scrolling past hero */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {/* Sidebar offset on desktop */}
        <div className="lg:pl-64">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)]">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--yellow)] transition-colors shrink-0"
            >
              <span className="text-base leading-none">←</span>
            </Link>

            <p className="text-sm font-semibold text-[var(--text-primary)] truncate mx-4">
              {series.name}
            </p>

            <FavoriteButton series={series} />
          </div>
        </div>
      </div>
    </>
  );
};

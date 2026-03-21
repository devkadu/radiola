"use client";

import { useState } from "react";

interface Props {
  youtubeKey: string;
  title: string;
}

export function VideoPlayButton({ youtubeKey, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Assistir trailer"
        className="absolute inset-0 flex items-center justify-center group"
      >
        <div className="w-14 h-14 rounded-full bg-black/60 border-2 border-white/80 flex items-center justify-center group-hover:bg-black/80 group-hover:scale-110 transition-all duration-200">
          <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
                title={title}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";

interface Props {
  youtubeKey: string;
  title: string;
}

export const VideoPlayButton = ({ youtubeKey, title }: Props) => {
  const [open, setOpen] = useState(false);
  const [loadPlayer, setLoadPlayer] = useState(false);
  const close = () => { setOpen(false); setLoadPlayer(false); };

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
          role="dialog"
          aria-modal="true"
          aria-label={`Trailer: ${title}`}
          onClick={close}
          onKeyDown={(event) => { if (event.key === "Escape") close(); }}
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={close}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-3xl leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
            <div className={`relative w-full rounded-xl overflow-hidden${loadPlayer ? " aspect-video" : ""}`}>
              {loadPlayer ? <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0`}
                title={title}
                referrerPolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              /> : <div className="h-full flex flex-col justify-center items-center gap-4 bg-[var(--bg-surface)] p-6 text-center">
                <p className="text-white">Este trailer é carregado pelo YouTube.</p>
                <p className="max-w-md text-sm text-white/70">Ao carregar o vídeo, seu navegador se conecta ao Google, que pode tratar dados técnicos e usar armazenamento próprio.</p>
                <a href="/cookies" className="text-sm text-[var(--yellow)] underline">Sobre conteúdo externo</a>
                <button autoFocus onClick={() => setLoadPlayer(true)} className="rounded-lg bg-[var(--yellow)] px-4 py-2 font-semibold text-black">Carregar vídeo do YouTube</button>
              </div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

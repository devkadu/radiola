export function ProfileStats({ daysMember, watchedEpisodesCount, favoriteCount, commentCount, totalLikes }: { daysMember: number; watchedEpisodesCount: number; favoriteCount: number; commentCount: number; totalLikes: number }) {
  return (<>
            {/* Bento de stats */}
            <div className="grid grid-cols-2 gap-3">

              {/* Card grande: dias como membro */}
              <div className="row-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between min-h-[140px]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Membro há</p>
                <div>
                  <p className="text-5xl font-extrabold text-white leading-none">{daysMember}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-snug">dias na plataforma</p>
                </div>
              </div>

              {/* Episódios assistidos */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Episódios</p>
                <p className="text-3xl font-extrabold text-white leading-none">{watchedEpisodesCount.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">assistidos</p>
              </div>

              {/* Séries na lista */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Séries</p>
                <p className="text-3xl font-extrabold text-white leading-none">{favoriteCount}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">na lista</p>
              </div>

              {/* Comentários */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Comentários</p>
                <p className="text-3xl font-extrabold text-white leading-none">{commentCount}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">publicados</p>
              </div>

              {/* Curtidas recebidas */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Curtidas</p>
                <p className="text-3xl font-extrabold text-white leading-none">{totalLikes}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">recebidas</p>
              </div>
            </div>


  </>);
}

import { ProfileVisibilityBadge as BadgePublic } from "../profile-visibility-badge/profile-visibility-badge";
export function ProfileRatings({ reactionCounts }: { reactionCounts: Record<string, number> }) {
 const starCounts = [5,4,3,2,1].map(star => ({star, count: reactionCounts[String(star)] ?? 0}));
 const totalRatings = starCounts.reduce((sum,row) => sum + row.count, 0);
 const avgRating = totalRatings ? starCounts.reduce((sum,row) => sum + row.star * row.count, 0) / totalRatings : 0;

  return (<>
            {/* Avaliações */}
            {totalRatings > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                  Suas avaliações <BadgePublic />
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-3xl font-bold text-[var(--yellow)] leading-none">{avgRating.toFixed(1)}</span>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} width="10" height="10" viewBox="0 0 24 24" fill={s <= Math.round(avgRating) ? "var(--yellow)" : "none"} stroke="var(--yellow)" strokeWidth="1.5" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1">{totalRatings} ep.</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    {starCounts.map(({ star, count }) => {
                      const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--text-muted)] w-2 text-right">{star}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--yellow)] transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] w-4 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


  </>);
}

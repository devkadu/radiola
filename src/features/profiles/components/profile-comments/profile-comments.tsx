import { useState } from "react";
import type { ProfileOverview } from "../../types/profile";
import { formatEpisodeLabel,relativeTime } from "../../utils/profile-formatters";
import { ProfileVisibilityBadge as BadgePublic } from "../profile-visibility-badge/profile-visibility-badge";
export function ProfileComments({ topComment, recentComments, seriesNames }: Pick<ProfileOverview, "topComment" | "recentComments" | "seriesNames">) {
 const [now] = useState(() => Date.now());
 const formatEpId = formatEpisodeLabel;
 return (<>
            {/* Comentário mais curtido */}
            {topComment && (topComment.likes ?? 0) > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                  Comentário mais curtido <BadgePublic />
                </p>
                <p className="text-xs font-semibold text-[var(--yellow)] mb-2 uppercase tracking-wide">
                  {formatEpId(topComment.episode_id, seriesNames)}
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
                  &ldquo;{topComment.text}&rdquo;
                </p>
                <p className="text-xs text-[var(--yellow)]">♥ {topComment.likes} curtidas</p>
              </div>
            )}

            {/* Últimos comentários */}
            {recentComments.length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
                  Últimos comentários <BadgePublic />
                </p>
                <div className="flex flex-col">
                  {recentComments.map((c, i) => (
                    <div key={c.id} className={`py-3 ${i < recentComments.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                      <p className="text-xs font-semibold text-[var(--yellow)] mb-1">{formatEpId(c.episode_id, seriesNames)}</p>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">&ldquo;{c.text}&rdquo;</p>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                        <span>♥ {c.likes ?? 0}</span>
                        <span>{relativeTime(c.created_at, now)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

 </>);
}

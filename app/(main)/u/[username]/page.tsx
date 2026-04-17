import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import type { Metadata } from "next";
import { FollowButton } from "./_follow";

interface Props {
  params: Promise<{ username: string }>;
}

export const revalidate = 3600; // 1h

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} · Segunda Temporada`,
    description: `Veja o perfil de ${username} no Segunda Temporada — séries assistidas, avaliações e comentários.`,
  };
}

function formatEpId(epId: string, names: Record<number, string> = {}) {
  const m = epId.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!m) return epId;
  const name = names[parseInt(m[1])] ?? `#${m[1]}`;
  return `${name} · T${m[2].padStart(2, "0")} E${m[3].padStart(2, "0")}`;
}

function relativeTime(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function memberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function CircleProgress({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--yellow)" strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--yellow)]">
        {pct}%
      </span>
    </div>
  );
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  const decodedUsername = decodeURIComponent(username);

  // Primeiro: busca pelo username na tabela de comentários (caminho rápido)
  const { data: sample } = await supabaseAdmin
    .from("comments")
    .select("user_id")
    .eq("username", decodedUsername)
    .limit(1)
    .maybeSingle();

  let target: any = null;

  if (sample) {
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(sample.user_id);
    target = user;
  } else {
    // Fallback: varre os usuários do Auth procurando pelo username nos metadados
    // (cobre usuários que ainda não comentaram)
    let page = 1;
    outer: while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !users?.length) break;
      for (const u of users) {
        const meta = u.user_metadata?.username ?? u.email?.split("@")[0] ?? "";
        if (meta === decodedUsername) { target = u; break outer; }
      }
      if (users.length < 1000) break;
      page++;
    }
  }

  if (!target) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <p className="text-4xl">👤</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">Usuário não encontrado</p>
        <Link href="/" className="text-sm text-[var(--yellow)] hover:underline">← Voltar</Link>
      </main>
    );
  }

  if (target.user_metadata?.profile_public === false) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <p className="text-4xl">🔒</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">Perfil privado</p>
        <p className="text-sm">{username} optou por manter o perfil privado.</p>
        <Link href="/" className="text-sm text-[var(--yellow)] hover:underline">← Voltar</Link>
      </main>
    );
  }

  const uid = target.id;
  const displayUsername = target.user_metadata?.username || target.email?.split("@")[0] || username;
  const avatarUrl = target.user_metadata?.avatar_url ?? target.user_metadata?.picture ?? null;
  const initials = displayUsername.slice(0, 2).toUpperCase();

  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const [
    { count: commentCount },
    { data: favorites },
    { data: comments },
    { count: followerCount },
    currentFollowing,
    { data: watchedRaw },
  ] = await Promise.all([
    supabaseAdmin.from("comments").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabaseAdmin.from("user_series").select("series_id, series_name, series_slug, poster_path").eq("user_id", uid).order("created_at", { ascending: false }),
    supabaseAdmin.from("comments").select("id, text, likes, episode_id, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("follows").select("id", { count: "exact", head: true }).eq("following_id", uid),
    currentUser
      ? supabaseAdmin.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", uid).maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from("watched_episodes").select("episode_id, watched_at").eq("user_id", uid).order("watched_at", { ascending: false }).limit(6),
  ]);

  const totalLikes = (comments ?? []).reduce((a, c) => a + (c.likes ?? 0), 0);
  const topComment = [...(comments ?? [])].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).find(c => (c.likes ?? 0) > 0);
  const recentComments = (comments ?? []).slice(0, 3);

  // Nomes das séries dos comentários
  const commentSeriesIds = [...new Set((comments ?? []).map(c => {
    const m = c.episode_id.match(/^(\d+)-s/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean))] as number[];
  const { data: seriesData } = commentSeriesIds.length
    ? await supabaseAdmin.from("series").select("id, name").in("id", commentSeriesIds)
    : { data: [] };
  const seriesNames: Record<number, string> = {};
  for (const s of seriesData ?? []) seriesNames[s.id] = s.name;

  // Parse watched episodes from episode_id string
  const watchedEpisodes = (watchedRaw ?? []).map(w => {
    const m = w.episode_id.match(/^(\d+)-s(\d+)-e(\d+)$/);
    if (!m) return null;
    return {
      episode_id: w.episode_id,
      watched_at: w.watched_at,
      series_id: parseInt(m[1]),
      season: parseInt(m[2]),
      episode: parseInt(m[3]),
    };
  }).filter(Boolean) as { episode_id: string; watched_at: string; series_id: number; season: number; episode: number }[];

  // Busca nomes das séries dos episódios assistidos
  const watchedSeriesIds = [...new Set(watchedEpisodes.map(w => w.series_id))];
  const { data: watchedSeriesData } = watchedSeriesIds.length
    ? await supabaseAdmin.from("series").select("id, name, slug").in("id", watchedSeriesIds)
    : { data: [] };
  const watchedSeriesMap: Record<number, { name: string; slug: string }> = {};
  for (const s of watchedSeriesData ?? []) watchedSeriesMap[s.id] = { name: s.name, slug: s.slug };

  // Progresso por série favorita
  const { data: allWatched } = await supabaseAdmin
    .from("watched_episodes")
    .select("episode_id")
    .eq("user_id", uid);

  const watchedCountBySeries: Record<number, number> = {};
  for (const w of allWatched ?? []) {
    const m = w.episode_id.match(/^(\d+)-s/);
    if (m) {
      const sid = parseInt(m[1]);
      watchedCountBySeries[sid] = (watchedCountBySeries[sid] ?? 0) + 1;
    }
  }

  // Total de episódios por série (da tabela episodes)
  const favSeriesIds = (favorites ?? []).map(f => f.series_id);
  const { data: episodeCounts } = favSeriesIds.length
    ? await supabaseAdmin
        .from("episodes")
        .select("series_id")
        .in("series_id", favSeriesIds)
    : { data: [] };

  const totalEpsBySeries: Record<number, number> = {};
  for (const e of episodeCounts ?? []) {
    totalEpsBySeries[e.series_id] = (totalEpsBySeries[e.series_id] ?? 0) + 1;
  }

  return (
    <main className="px-4 py-6 lg:py-10 max-w-lg pb-28">

      {currentUser && currentUser.id !== uid && (
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-5"
        >
          ← Meu perfil
        </Link>
      )}

      {/* Hero */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden mb-4">
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden bg-[var(--yellow)] flex items-center justify-center text-xl font-bold text-black">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayUsername} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-xl">{displayUsername}</p>
              <p className="text-xs text-[var(--yellow)] mt-0.5">Membro desde {memberSince(target.created_at)}</p>
            </div>
          </div>
          {currentUser?.id !== uid && (
            <FollowButton
              followingId={uid}
              initialFollowing={!!currentFollowing?.data}
              currentUserId={currentUser?.id ?? null}
            />
          )}
        </div>
        <div className="border-t border-[var(--border)] px-5 py-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: "comentários", value: commentCount ?? 0 },
              { label: "séries", value: (favorites ?? []).length },
              { label: "curtidas recebidas", value: totalLikes },
              { label: "seguidores", value: followerCount ?? 0 },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Últimos episódios assistidos */}
      {watchedEpisodes.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Últimos assistidos
          </p>
          <div className="flex flex-col">
            {watchedEpisodes.map((w, i) => {
              const series = watchedSeriesMap[w.series_id];
              const seasonLabel = `T${String(w.season).padStart(2, "0")}`;
              const epLabel = `E${String(w.episode).padStart(2, "0")}`;
              const href = series ? `/series/${series.slug}/temporada-${w.season}/episodio-${w.episode}-` : "#";
              return (
                <Link
                  key={w.episode_id}
                  href={href}
                  className={`flex items-center justify-between py-2.5 gap-3 hover:opacity-80 transition-opacity ${
                    i < watchedEpisodes.length - 1 ? "border-b border-[var(--border)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[var(--yellow)] font-bold shrink-0">{seasonLabel}·{epLabel}</span>
                    <span className="text-sm text-[var(--text-primary)] truncate">
                      {series?.name ?? `Série #${w.series_id}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">{relativeTime(w.watched_at)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Séries favoritas com progresso circular */}
      {(favorites ?? []).length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Séries favoritas</p>
          <div className="flex flex-col">
            {(favorites ?? []).map((s, i) => {
              const watched = watchedCountBySeries[s.series_id] ?? 0;
              const total = totalEpsBySeries[s.series_id] ?? 0;
              const pct = total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : 0;
              return (
                <Link
                  key={s.series_id}
                  href={`/series/${s.series_slug}`}
                  className={`flex items-center gap-3 py-3 hover:opacity-80 transition-opacity ${
                    i < (favorites ?? []).length - 1 ? "border-b border-[var(--border)]" : ""
                  }`}
                >
                  {/* Poster */}
                  <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-elevated)]">
                    {s.poster_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} alt={s.series_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                    )}
                  </div>

                  {/* Name + progress */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.series_name}</p>
                    {total > 0 && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{watched} de {total} ep.</p>
                    )}
                  </div>

                  {/* Circular progress */}
                  {total > 0 && <CircleProgress pct={pct} />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Top comment */}
      {topComment && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Comentário mais curtido</p>
          <div className="bg-[var(--bg-elevated)] rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--yellow)] mb-2 uppercase tracking-wide">{formatEpId(topComment.episode_id, seriesNames)}</p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-2">&ldquo;{topComment.text}&rdquo;</p>
            <p className="text-xs text-[var(--yellow)]">♥ {topComment.likes} curtidas</p>
          </div>
        </div>
      )}

      {/* Recent comments */}
      {recentComments.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Últimos comentários</p>
          <div className="flex flex-col">
            {recentComments.map((c, i) => (
              <div key={c.id} className={`py-3 ${i < recentComments.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                <p className="text-xs font-semibold text-[var(--yellow)] mb-1">{formatEpId(c.episode_id, seriesNames)}</p>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">&ldquo;{c.text}&rdquo;</p>
                <div className="flex gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                  <span>♥ {c.likes ?? 0}</span>
                  <span>{relativeTime(c.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}

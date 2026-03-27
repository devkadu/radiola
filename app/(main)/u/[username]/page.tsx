import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import type { Metadata } from "next";
import { FollowButton } from "./_follow";

const REACTIONS = [
  { key: "chocante", emoji: "😱", color: "rgba(232,92,92,0.55)" },
  { key: "incrivel", emoji: "🔥", color: "rgba(232,168,48,0.55)" },
  { key: "emocionante", emoji: "💗", color: "rgba(232,120,80,0.55)" },
  { key: "surpreso", emoji: "😮", color: "rgba(100,160,220,0.55)" },
  { key: "mediano", emoji: "😐", color: "rgba(150,150,150,0.35)" },
  { key: "decepcionante", emoji: "😞", color: "rgba(80,80,80,0.3)" },
];

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} · Segunda Temporada` };
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

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  // Busca user_id pelo username na tabela de comentários — evita carregar todos os usuários
  const { data: sample } = await supabaseAdmin
    .from("comments")
    .select("user_id")
    .eq("username", username)
    .limit(1)
    .maybeSingle();

  const { data: { user: target } } = sample
    ? await supabaseAdmin.auth.admin.getUserById(sample.user_id)
    : { data: { user: null } };

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
    { data: reactions },
    { data: comments },
    { count: followerCount },
    currentFollowing,
  ] = await Promise.all([
    supabaseAdmin.from("comments").select("id", { count: "exact", head: true }).eq("user_id", uid),
    supabaseAdmin.from("user_series").select("series_id, series_name, series_slug, poster_path").eq("user_id", uid).order("created_at", { ascending: false }),
    supabaseAdmin.from("episode_reactions").select("reaction_key").eq("user_id", uid),
    supabaseAdmin.from("comments").select("id, text, likes, episode_id, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("follows").select("id", { count: "exact", head: true }).eq("following_id", uid),
    currentUser
      ? supabaseAdmin.from("follows").select("id").eq("follower_id", currentUser.id).eq("following_id", uid).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const totalLikes = (comments ?? []).reduce((a, c) => a + (c.likes ?? 0), 0);
  const topComment = [...(comments ?? [])].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0)).find(c => (c.likes ?? 0) > 0);
  const recentComments = (comments ?? []).slice(0, 3);

  // Busca nomes das séries pela tabela de cache
  const seriesIds = [...new Set((comments ?? []).map(c => {
    const m = c.episode_id.match(/^(\d+)-s/);
    return m ? parseInt(m[1]) : null;
  }).filter(Boolean))] as number[];
  const { data: seriesData } = seriesIds.length
    ? await supabaseAdmin.from("series").select("id, name").in("id", seriesIds)
    : { data: [] };
  const seriesNames: Record<number, string> = {};
  for (const s of seriesData ?? []) seriesNames[s.id] = s.name;

  const reactionCounts: Record<string, number> = {};
  for (const r of reactions ?? []) {
    reactionCounts[r.reaction_key] = (reactionCounts[r.reaction_key] ?? 0) + 1;
  }
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const maxReactionCount = Math.max(...Object.values(reactionCounts), 1);

  return (
    <main className="px-4 py-6 lg:py-10 max-w-lg pb-28">

      {/* Voltar ao meu perfil */}
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

      {/* Personality */}
      {totalReactions > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Personalidade de espectador</p>
          <div className="flex items-end justify-around gap-1 h-24">
            {REACTIONS.map((r) => {
              const count = reactionCounts[r.key] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / totalReactions) * 100);
              const heightPct = Math.round((count / maxReactionCount) * 100);
              return (
                <div key={r.key} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t-md" style={{ height: `${heightPct}%`, backgroundColor: r.color, minHeight: "8px" }} />
                  <span className="text-base leading-none mt-1">{r.emoji}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorites */}
      {(favorites ?? []).length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Séries favoritas</p>
          <div className="grid grid-cols-3 gap-3">
            {(favorites ?? []).map((s) => (
              <Link key={s.series_id} href={`/series/${s.series_slug}`} className="group flex flex-col gap-1.5">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
                  {s.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://image.tmdb.org/t/p/w300${s.poster_path}`} alt={s.series_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--yellow)] transition-colors">{s.series_name}</p>
              </Link>
            ))}
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

"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { favoritesService } from "@/services/favorites";
import { User } from "@supabase/supabase-js";
import { FaPencil, FaShareNodes, FaArrowLeft } from "react-icons/fa6";

interface Props { user: User; }

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_DIMENSION = 400;

const REACTIONS = [
  { key: "chocante",      emoji: "😱", color: "#c0495a" },
  { key: "incrivel",      emoji: "🔥", color: "#8b7d2a" },
  { key: "emocionante",   emoji: "💗", color: "#c47a5a" },
  { key: "surpreso",      emoji: "😮", color: "#3a6d9e" },
  { key: "mediano",       emoji: "😐", color: "#3a3f4a" },
  { key: "decepcionante", emoji: "😞", color: "#2a2d35" },
];

interface RecentComment {
  id: string;
  text: string;
  likes: number | null;
  episode_id: string;
  created_at: string;
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha")), "image/webp", 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function memberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
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

const BadgePrivate = () => (
  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 tracking-wide uppercase">só eu vejo</span>
);

const BadgePublic = () => (
  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-950 text-green-400 border border-green-900 tracking-wide uppercase">visível</span>
);

interface ToggleItemProps {
  label: string;
  desc: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleItem({ label, desc, value, onToggle }: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors ${
          value ? "bg-[var(--yellow)] border-[var(--yellow)]" : "bg-[var(--bg-elevated)] border-[var(--border)]"
        }`}
      >
        <span className={`inline-block h-3 w-3 mt-0.5 rounded-full bg-white shadow transition-transform ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`} />
      </button>
    </div>
  );
}

export const ProfileClient = ({ user }: Props) => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const username = user.user_metadata?.username || user.email?.split("@")[0] || "usuário";
  const initials = username.slice(0, 2).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyReplies, setNotifyReplies] = useState<boolean>(user.user_metadata?.notify_replies !== false);
  const [notifyWeekly, setNotifyWeekly] = useState<boolean>(user.user_metadata?.notify_weekly === true);
  const [notifyPremiere, setNotifyPremiere] = useState<boolean>(user.user_metadata?.notify_premiere !== false);
  const [isPublic, setIsPublic] = useState<boolean>(user.user_metadata?.profile_public !== false);
  const [copied, setCopied] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof favoritesService.getFavorites>>>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [topComment, setTopComment] = useState<any>(null);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [seriesNames, setSeriesNames] = useState<Record<number, string>>({});
  const [followerCount, setFollowerCount] = useState(0);

  const updateMeta = async (updates: Record<string, boolean>) => {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: updates });
  };

  useEffect(() => {
    const supabase = createClient();
    favoritesService.getFavorites(user.id).then(setFavorites);

    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setCommentCount(count ?? 0));

    supabase.from("comments").select("id, likes, text, episode_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (!data?.length) return;
        const total = data.reduce((a, c) => a + (c.likes ?? 0), 0);
        setTotalLikes(total);
        const best = data.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0];
        setTopComment(best);
      });

    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id)
      .then(({ count }) => setFollowerCount(count ?? 0));

    supabase.from("episode_reactions").select("reaction_key").eq("user_id", user.id)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const r of data ?? []) counts[r.reaction_key] = (counts[r.reaction_key] ?? 0) + 1;
        setReactionCounts(counts);
      });

    supabase.from("comments").select("id, text, likes, episode_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(async ({ data }) => {
        const rows = data ?? [];
        setRecentComments(rows);
        const ids = [...new Set(rows.map(c => {
          const m = c.episode_id.match(/^(\d+)-s/);
          return m ? parseInt(m[1]) : null;
        }).filter(Boolean))] as number[];
        if (ids.length) {
          const { data: series } = await supabase.from("series").select("id, name").in("id", ids);
          const map: Record<number, string> = {};
          for (const s of series ?? []) map[s.id] = s.name;
          setSeriesNames(map);
        }
      });
  }, [user.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Selecione uma imagem válida."); return; }
    if (file.size > MAX_INPUT_BYTES) { setError("A foto deve ter no máximo 15 MB."); return; }
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const supabase = createClient();
      const path = `${user.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: urlWithCache } });
      setAvatarUrl(urlWithCache);
      router.refresh();
    } catch { setError("Erro ao enviar foto. Tente novamente."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleShare = async () => {
    const url = window.location.origin + "/u/" + username;
    const shareData = { title: "Segunda Temporada", text: `${username} está na Segunda Temporada — Aqui sua série continua!`, url };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleNotify = async () => {
    const next = !notifyReplies;
    setNotifyReplies(next);
    await updateMeta({ notify_replies: next });
  };

  const handleToggleWeekly = async () => {
    const next = !notifyWeekly;
    setNotifyWeekly(next);
    await updateMeta({ notify_weekly: next });
  };

  const handleTogglePremiere = async () => {
    const next = !notifyPremiere;
    setNotifyPremiere(next);
    await updateMeta({ notify_premiere: next });
  };

  const handleTogglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    await updateMeta({ profile_public: next });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const maxReactionCount = Math.max(...Object.values(reactionCounts), 1);

  // ── Tela de edição ──────────────────────────────────────────────────────────
  if (editingProfile) {
    return (
      <main className="px-4 py-6 lg:py-10 max-w-lg pb-28 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setEditingProfile(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FaArrowLeft size={13} />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Editar perfil</h1>
        </div>

        {/* Foto */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Foto de perfil</p>
          <div className="flex items-center gap-4">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="relative shrink-0" aria-label="Alterar foto">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--yellow)] relative bg-[var(--bg-elevated)]">
                {avatarUrl
                  ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <div className="w-full h-full flex items-center justify-center bg-[var(--yellow)] text-black font-bold text-lg">{initials}</div>
                }
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--yellow)] flex items-center justify-center shadow-sm">
                <FaPencil size={9} className="text-black" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
              >
                {uploading ? "Enviando…" : "Alterar foto"}
              </button>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>
          </div>
        </div>

        {/* Privacidade */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Privacidade</p>
          <ToggleItem
            label="Perfil público"
            desc="Outros usuários podem ver seus comentários e séries favoritas"
            value={isPublic}
            onToggle={handleTogglePublic}
          />
        </div>

        {/* Notificações */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Notificações</p>
          <ToggleItem
            label="Respostas aos comentários"
            desc="Receber email quando alguém responder seu comentário"
            value={notifyReplies}
            onToggle={handleToggleNotify}
          />
          <ToggleItem
            label="Resumo semanal"
            desc="Email semanal com debates das suas séries favoritas"
            value={notifyWeekly}
            onToggle={handleToggleWeekly}
          />
          <ToggleItem
            label="Estreias"
            desc="Avisar quando uma série que você acompanha estrear"
            value={notifyPremiere}
            onToggle={handleTogglePremiere}
          />
        </div>

        {/* Sair */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-2xl border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors text-sm font-medium"
        >
          Sair da conta
        </button>
      </main>
    );
  }

  // ── Tela principal do perfil ─────────────────────────────────────────────────
  return (
    <main className="px-4 py-6 lg:py-10 max-w-lg pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Meu perfil</h1>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)] text-sm font-semibold hover:bg-[var(--yellow)] hover:text-black transition-colors"
        >
          <FaShareNodes size={13} />
          {copied ? "Copiado!" : "Compartilhar"}
        </button>
      </div>

      {/* User card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--yellow)] relative bg-[var(--bg-elevated)]">
              {avatarUrl
                ? <img src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <div className="w-full h-full flex items-center justify-center bg-[var(--yellow)] text-black font-bold text-lg">{initials}</div>
              }
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--text-primary)] text-base truncate">{username}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
              <BadgePrivate />
            </div>
            <p className="text-xs text-[var(--yellow)] mt-0.5">
              Membro desde {memberSince(user.created_at)}
            </p>
            <p className="text-xs text-[var(--yellow)] mt-0.5">
              segundatemporada.com.br/u/{username}
            </p>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => setEditingProfile(true)}
          className="w-full py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          Editar perfil
        </button>
      </div>

      {/* Personalidade de espectador */}
      {totalReactions > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
            Sua personalidade de espectador <BadgePublic />
          </p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "comentários", value: commentCount },
          { label: "séries", value: favorites.length },
          { label: "curtidas recebidas", value: totalLikes },
          { label: "seguidores", value: followerCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Séries favoritas */}
      {favorites.length > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
            Séries favoritas <BadgePublic />
          </p>
          <div className="grid grid-cols-3 gap-3">
            {favorites.map((s) => (
              <Link key={s.series_id} href={`/series/${s.series_slug}`} className="group flex flex-col gap-1.5">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
                  {s.poster_path
                    ? <img src={`https://image.tmdb.org/t/p/w300${s.poster_path}`} alt={s.series_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
                  }
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--yellow)] transition-colors">{s.series_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comentário mais curtido */}
      {topComment && topComment.likes > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
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
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-2">
            Últimos comentários <BadgePublic />
          </p>
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
};

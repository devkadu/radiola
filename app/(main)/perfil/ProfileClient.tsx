"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { favoritesService } from "@/services/favorites";
import { User } from "@supabase/supabase-js";
import { FaPencil, FaShareNodes } from "react-icons/fa6";

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

export const ProfileClient = ({ user }: Props) => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const username = user.user_metadata?.username || user.email?.split("@")[0] || "usuário";
  const initials = username.slice(0, 2).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Awaited<ReturnType<typeof favoritesService.getFavorites>>>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [topComment, setTopComment] = useState<any>(null);

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

    supabase.from("episode_reactions").select("reaction_key").eq("user_id", user.id)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const r of data ?? []) counts[r.reaction_key] = (counts[r.reaction_key] ?? 0) + 1;
        setReactionCounts(counts);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);
  const maxReactionCount = Math.max(...Object.values(reactionCounts), 1);

  return (
    <main className="px-4 py-6 lg:py-10 max-w-lg pb-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Meu perfil</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)] text-sm font-semibold hover:bg-[var(--yellow)] hover:text-black transition-colors">
          <FaShareNodes size={13} />
          Compartilhar
        </button>
      </div>

      {/* User card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="relative shrink-0 group" aria-label="Alterar foto">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[var(--yellow)] relative bg-[var(--bg-elevated)]">
              {avatarUrl
                ? <Image src={avatarUrl} alt={username} fill className="object-cover" sizes="64px" />
                : <div className="w-full h-full flex items-center justify-center bg-[var(--yellow)] text-black font-bold text-lg">{initials}</div>
              }
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Edit badge */}
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--yellow)] flex items-center justify-center shadow-sm">
              <FaPencil size={9} className="text-black" />
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--text-primary)] text-base truncate">{username}</p>
            <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
            <p className="text-xs text-[var(--yellow)] mt-0.5">
              Membro desde {memberSince(user.created_at)}
            </p>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Editar perfil
          </button>
          <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium">
            Sair
          </button>
        </div>
      </div>

      {/* Personalidade de espectador */}
      {totalReactions > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
            Sua personalidade de espectador
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
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "comentários", value: commentCount },
          { label: "séries", value: favorites.length },
          { label: "curtidas recebidas", value: totalLikes },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Comentário mais curtido */}
      {topComment && topComment.likes > 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Comentário mais curtido
          </p>
          <p className="text-xs font-semibold text-[var(--yellow)] mb-2 uppercase tracking-wide">
            {topComment.episode_id?.replace(/-s(\d+)-e(\d+)$/, " · T$1 E$2")}
          </p>
          <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
            &ldquo;{topComment.text}&rdquo;
          </p>
          <p className="text-xs text-[var(--yellow)]">♥ {topComment.likes} curtidas</p>
        </div>
      )}

      {/* Séries favoritas */}
      {favorites.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Séries favoritas
          </p>
          <div className="grid grid-cols-3 gap-3">
            {favorites.map((s) => (
              <Link key={s.series_id} href={`/series/${s.series_slug}`} className="group flex flex-col gap-1.5">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
                  {s.poster_path
                    ? <Image src={`https://image.tmdb.org/t/p/w300${s.poster_path}`} alt={s.series_name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📺</div>
                  }
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--yellow)] transition-colors">{s.series_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { User } from "@supabase/supabase-js";
import { FaCamera } from "react-icons/fa6";

interface Props {
  user: User;
}

const MAX_SIZE_BYTES = 500 * 1024; // 500 KB
const MAX_DIMENSION = 256;

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
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao comprimir")), "image/webp", 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const ProfileClient = ({ user }: Props) => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const username = user.user_metadata?.username || user.email?.split("@")[0] || "usuário";
  const initials = username.slice(0, 2).toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.user_metadata?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem válida.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("A foto deve ter no máximo 500 KB.");
      return;
    }

    setUploading(true);
    try {
      const blob = await compressImage(file);
      const supabase = createClient();
      const path = `${user.id}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/webp" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;

      await supabase.auth.updateUser({ data: { avatar_url: urlWithCache } });
      setAvatarUrl(urlWithCache);
      router.refresh();
    } catch {
      setError("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <main className="px-4 py-8 lg:py-10 max-w-lg">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-6">Meu perfil</h1>

      {/* Avatar + info */}
      <div className="flex items-center gap-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 mb-6">
        {/* Avatar clicável */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative w-16 h-16 rounded-full shrink-0 group"
          aria-label="Alterar foto de perfil"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              fill
              className="object-cover rounded-full"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[var(--yellow)] flex items-center justify-center text-black font-bold text-lg">
              {initials}
            </div>
          )}

          {/* Overlay câmera */}
          <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaCamera size={16} className="text-white" />
            )}
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate">{username}</p>
          <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs text-[var(--yellow)] hover:text-[var(--yellow-dim)] mt-1 transition-colors"
          >
            {uploading ? "Enviando..." : "Alterar foto"}
          </button>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>

      {/* Stats mock */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Comentários", value: "0" },
          { label: "Séries", value: "0" },
          { label: "Debates", value: "0" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSignOut}
          className="w-full border border-[var(--border)] text-[var(--text-secondary)] font-medium py-3 rounded-lg text-sm hover:border-red-500 hover:text-red-500 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
};

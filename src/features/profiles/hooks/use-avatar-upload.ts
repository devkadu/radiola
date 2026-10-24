"use client";

import { createClient } from "@/shared/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useRef,useState,type ChangeEvent } from "react";
import { compressAvatar } from "../utils/compress-avatar";

export function useAvatarUpload(userId: string, initialUrl: string | null) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setError(null);
    if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
      setError("Selecione uma imagem de até 15 MB."); return;
    }
    setUploading(true);
    try {
      const blob = await compressAvatar(file);
      const supabase = createClient();
      const path = `${userId}/avatar.webp`;
      const { error: uploadError } = await supabase.storage.from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: avatar } });
      if (updateError) throw updateError;
      setAvatarUrl(avatar);
      router.refresh();
    } catch {
      setError("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return { fileRef, avatarUrl, uploading, error, handleFileChange };
}

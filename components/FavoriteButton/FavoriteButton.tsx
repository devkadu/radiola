"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { favoritesService } from "@/services/favorites";
import { useRouter } from "next/navigation";

interface Props {
  series: {
    id: number;
    name: string;
    slug: string;
    poster_path: string | null;
  };
  compact?: boolean;
}

type Toast = { type: "success" | "auth"; message: string } | null;

export const FavoriteButton = ({ series, compact }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    favoritesService.isFavorited(user.id, series.id).then((v) => {
      setFavorited(v);
      setLoading(false);
    });
  }, [user, series.id]);

  const showToast = (t: Toast) => {
    setToast(t);
    if (t?.type === "success") setTimeout(() => setToast(null), 3000);
  };

  const toggle = async () => {
    if (!user) {
      showToast({ type: "auth", message: "" });
      return;
    }
    const next = !favorited;
    setFavorited(next);
    if (next) {
      await favoritesService.add(user.id, series);
      showToast({ type: "success", message: "Série adicionada aos favoritos" });
    } else {
      await favoritesService.remove(user.id, series.id);
      showToast({ type: "success", message: "Série removida dos favoritos" });
    }
    router.refresh();
  };

  if (loading) return <div className={compact ? "w-7 h-7" : "w-10 h-10"} />;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={(e) => { e.preventDefault(); toggle(); }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all bg-black/60 ${
            favorited ? "text-red-400" : "text-white/70 hover:text-red-400"
          }`}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {favorited ? <FaHeart size={11} /> : <FaRegHeart size={11} />}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
          favorited
            ? "bg-red-500/20 border-red-500 text-red-500"
            : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-muted)] hover:border-red-400 hover:text-red-400"
        }`}
        aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        {favorited ? <FaHeart size={15} /> : <FaRegHeart size={15} />}
      </button>

      {/* Toast */}
      {toast && (
        <div className="absolute right-0 top-12 z-50 w-max max-w-[280px]">
          {toast.type === "success" && (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg">
              {toast.message}
            </div>
          )}
          {toast.type === "auth" && (
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-4 shadow-lg">
              <p className="text-sm text-[var(--text-primary)] mb-3">
                Para favoritar é necessário estar logado.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors"
                  onClick={() => setToast(null)}
                >
                  Logar
                </Link>
                <Link
                  href="/criar-conta"
                  className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--yellow)] text-black font-semibold hover:bg-[var(--yellow-dim)] transition-colors"
                  onClick={() => setToast(null)}
                >
                  Criar conta
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

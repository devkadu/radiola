"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaXmark } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
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
  variant?: "icon" | "list";
}

const AuthSheet = ({
  seriesName,
  posterPath,
  onClose,
}: {
  seriesName: string;
  posterPath: string | null;
  onClose: () => void;
}) => (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Mobile: bottom sheet */}
    <div className="lg:hidden fixed z-50 inset-x-0 bottom-0 animate-slide-up rounded-t-2xl bg-[var(--bg-surface)] border-t border-[var(--border)]">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
      </div>
      <div className="px-6 pt-3 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {posterPath && (
            <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0">
              <Image
                src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                alt={seriesName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-0.5">Adicionar à lista</p>
            <p className="text-base font-bold text-[var(--text-primary)] leading-tight">{seriesName}</p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Entre na sua conta para salvar séries na sua lista e acompanhar o que está assistindo.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/criar-conta"
            onClick={onClose}
            className="text-center py-3 rounded-xl bg-[var(--yellow)] text-black font-semibold text-sm hover:bg-[var(--yellow-dim)] transition-colors"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="text-center py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>

    {/* Desktop: side panel */}
    <div className="hidden lg:flex fixed z-50 top-0 right-0 bottom-0 w-[380px] animate-slide-in-right bg-[var(--bg-surface)] border-l border-[var(--border)] flex-col">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Adicionar à lista</p>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
        >
          <FaXmark size={14} />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center px-8 gap-6">
        {posterPath && (
          <div className="relative w-24 h-36 rounded-xl overflow-hidden mx-auto shadow-xl">
            <Image
              src={`https://image.tmdb.org/t/p/w185${posterPath}`}
              alt={seriesName}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        )}
        <div className="text-center">
          <p className="text-lg font-bold text-[var(--text-primary)]">{seriesName}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            Entre na sua conta para salvar séries na sua lista e acompanhar o que está assistindo.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/criar-conta"
            onClick={onClose}
            className="text-center py-3 rounded-xl bg-[var(--yellow)] text-black font-semibold text-sm hover:bg-[var(--yellow-dim)] transition-colors"
          >
            Criar conta grátis
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="text-center py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  </>
);

export const FavoriteButton = ({ series, compact, variant = "icon" }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthSheet, setShowAuthSheet] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    favoritesService.isFavorited(user.id, series.id).then((v) => {
      setFavorited(v);
      setLoading(false);
    });
  }, [user, series.id]);

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!user) {
      setShowAuthSheet(true);
      return;
    }
    const next = !favorited;
    setFavorited(next);
    if (next) {
      await favoritesService.add(user.id, series);
      setSuccessMsg("Série adicionada à lista");
    } else {
      await favoritesService.remove(user.id, series.id);
      setSuccessMsg("Série removida da lista");
    }
    setTimeout(() => setSuccessMsg(null), 3000);
    router.refresh();
  };

  if (loading) return <div className={compact ? "w-7 h-7" : variant === "list" ? "h-10 w-40" : "w-10 h-10"} />;

  /* ── variant: list ── */
  if (variant === "list") {
    return (
      <>
        <div className="relative">
          <button
            onClick={toggle}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              favorited
                ? "bg-[var(--yellow-muted)] border border-[var(--yellow)] text-[var(--yellow)]"
                : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
            }`}
            aria-label={favorited ? "Remover da lista" : "Adicionar à lista"}
          >
            {favorited ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
            {favorited ? "Na sua lista" : "Adicionar à lista"}
          </button>
          {successMsg && (
            <div className="absolute right-0 top-12 z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg whitespace-nowrap">
              {successMsg}
            </div>
          )}
        </div>
        {showAuthSheet && (
          <AuthSheet
            seriesName={series.name}
            posterPath={series.poster_path}
            onClose={() => setShowAuthSheet(false)}
          />
        )}
      </>
    );
  }

  /* ── variant: compact ── */
  if (compact) {
    return (
      <>
        <button
          onClick={toggle}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all bg-black/60 ${
            favorited ? "text-red-400" : "text-white/70 hover:text-red-400"
          }`}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {favorited ? <FaHeart size={11} /> : <FaRegHeart size={11} />}
        </button>
        {showAuthSheet && (
          <AuthSheet
            seriesName={series.name}
            posterPath={series.poster_path}
            onClose={() => setShowAuthSheet(false)}
          />
        )}
      </>
    );
  }

  /* ── variant: icon (default) ── */
  return (
    <>
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
        {successMsg && (
          <div className="absolute right-0 top-12 z-50 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] shadow-lg whitespace-nowrap">
            {successMsg}
          </div>
        )}
      </div>
      {showAuthSheet && (
        <AuthSheet
          seriesName={series.name}
          posterPath={series.poster_path}
          onClose={() => setShowAuthSheet(false)}
        />
      )}
    </>
  );
};

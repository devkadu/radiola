"use client";
import Image from "next/image";
import { FaPencil,FaShareNodes } from "react-icons/fa6";
import type { useAvatarUpload } from "../../hooks/use-avatar-upload";
import { useProfileShare } from "../../hooks/use-profile-share";
export function ProfileHeader({ username, createdAt, badges, avatar, onEdit }: { username: string; createdAt: string; badges: string[]; avatar: ReturnType<typeof useAvatarUpload>; onEdit: () => void }) {
 const { fileRef, avatarUrl, uploading, error, handleFileChange } = avatar;
 const { share: handleShare, copied, error: shareError } = useProfileShare(username);
 const initials = username.slice(0, 2).toUpperCase();
 const memberSince = (date: string) => new Date(date).toLocaleDateString("pt-BR", {month:"long", year:"numeric"});

  return (<>
      {/* Hero banner + avatar wrapper */}
      <div className="relative">
        <div
          className="h-44 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e0e1f 0%, #1d0b35 45%, #0b1a2e 100%)" }}
        >
          {/* Radial glows decorativos */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 70% 60%, #7c3aed44 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, #1e40af33 0%, transparent 45%)",
            }}
          />
          {/* Botão editar */}
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold hover:bg-white/20 transition-colors z-10"
          >
            <FaPencil size={9} />
            Editar Perfil
          </button>
        </div>

        {/* Avatar — fora do overflow-hidden, sobrepõe o banner */}
        <div className="absolute bottom-0 left-5 translate-y-1/2 z-10">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="block"
              aria-label="Alterar foto"
            >
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden ring-4 ring-[var(--bg)] bg-[var(--bg-elevated)] relative">
                {avatarUrl
                  ? <Image width={72} height={72} unoptimized src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <div className="w-full h-full flex items-center justify-center bg-[var(--yellow)] text-black font-bold text-xl">{initials}</div>
                }
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--yellow)] flex items-center justify-center shadow-md">
                <FaPencil size={8} className="text-black" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-red-400 px-5 mt-1">{error}</p>}

      {shareError && <p role="alert" className="text-red-400 px-5">{shareError}</p>}
      {/* Nome + badges */}
      <div className="px-5 pt-10 pb-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white leading-tight">{username}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-[var(--yellow)]/40 bg-[var(--yellow)]/10 text-[var(--yellow)] tracking-widest uppercase"
              >
                {badge}
              </span>
            ))}
            <span className="text-[10px] text-[var(--text-muted)]">
              Membro desde {memberSince(createdAt)}
            </span>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)] hover:border-[var(--yellow)] transition-colors"
        >
          <FaShareNodes size={11} />
          {copied ? "Copiado!" : "Compartilhar"}
        </button>
      </div>


  </>);
}

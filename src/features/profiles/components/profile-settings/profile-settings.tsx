"use client";
import Image from "next/image";
import { FaArrowLeft,FaPencil } from "react-icons/fa6";
import type { useAvatarUpload } from "../../hooks/use-avatar-upload";
import type { useProfileSettings } from "../../hooks/use-profile-settings";
import { ProfileToggle } from "../profile-toggle/profile-toggle";
interface Props { username: string; avatar: ReturnType<typeof useAvatarUpload>; settings: ReturnType<typeof useProfileSettings>; onBack: () => void; onSignOut: () => void; }
export function ProfileSettings({ username, avatar, settings, onBack, onSignOut }: Props) {
 const { fileRef, avatarUrl, uploading, error, handleFileChange } = avatar;
 const initials = username.slice(0, 2).toUpperCase();
 const { preferences, toggle } = settings;
    return (
      <main className="px-4 py-6 lg:py-10 max-w-lg pb-28 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FaArrowLeft aria-label="Voltar" size={13} />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Editar perfil</h1>
        </div>

        {/* Foto */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Foto de perfil</p>
          <div className="flex items-center gap-4">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="relative shrink-0" aria-label="Alterar foto">
              <div className="w-16 h-16 rounded-full overflow-hidden relative bg-[var(--bg-elevated)]">
                {avatarUrl
                  ? <Image width={64} height={64} unoptimized src={avatarUrl} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
          <ProfileToggle
            label="Perfil público"
            desc="Outros usuários podem ver seus comentários e séries favoritas"
            value={preferences.profile_public}
            onToggle={() => toggle("profile_public")} disabled={settings.pending}
          />
        </div>

        {/* Notificações */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Notificações</p>
          <ProfileToggle
            label="Respostas aos comentários"
            desc="Receber email quando alguém responder seu comentário"
            value={preferences.notify_replies}
            onToggle={() => toggle("notify_replies")} disabled={settings.pending}
          />
          <ProfileToggle
            label="Resumo semanal"
            desc="Email semanal com debates das suas séries favoritas"
            value={preferences.notify_weekly}
            onToggle={() => toggle("notify_weekly")} disabled={settings.pending}
          />
          <ProfileToggle
            label="Estreias"
            desc="Avisar quando uma série que você acompanha estrear"
            value={preferences.notify_premiere}
            onToggle={() => toggle("notify_premiere")} disabled={settings.pending}
          />
        </div>

        {settings.error && <p role="alert" className="text-red-400 mb-3">Não foi possível salvar. Tente novamente.</p>}
        {/* Sair */}
        <button
          onClick={onSignOut}
          className="w-full py-3 rounded-2xl border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors text-sm font-medium"
        >
          Sair da conta
        </button>
      </main>
    );
}

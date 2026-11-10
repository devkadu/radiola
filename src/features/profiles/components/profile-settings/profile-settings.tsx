"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { FaArrowLeft,FaPencil } from "react-icons/fa6";
import type { useAvatarUpload } from "../../hooks/use-avatar-upload";
import type { useProfileSettings } from "../../hooks/use-profile-settings";
import { ProfileToggle } from "../profile-toggle/profile-toggle";
import { PrivacyContact } from "@/features/privacy/components/privacy-contact";
import { profileUsernameSchema } from "../../schemas/profile-settings.schema";
interface Props { username: string; avatar: ReturnType<typeof useAvatarUpload>; settings: ReturnType<typeof useProfileSettings>; onBack: () => void; onSignOut: () => void; signingOut: boolean; }
export const ProfileSettings = ({ username, avatar, settings, onBack, onSignOut, signingOut }: Props) => {
 const { fileRef, avatarUrl, uploading, error, handleFileChange } = avatar;
 const initials = username.slice(0, 2).toUpperCase();
 const { preferences, toggle } = settings;
 const [draftUsername, setDraftUsername] = useState(username);
 const [usernameError, setUsernameError] = useState("");
 const [usernameSaved, setUsernameSaved] = useState(false);
 const handleSaveUsername = async (event: FormEvent<HTMLFormElement>) => {
   event.preventDefault();
   if (settings.pending) return;
   setUsernameSaved(false);
   const parsed = profileUsernameSchema.safeParse(draftUsername);
   if (!parsed.success) {
     setUsernameError(parsed.error.issues[0].message);
     return;
   }
   setUsernameError("");
   try {
     await settings.saveUsername(parsed.data);
     setDraftUsername(parsed.data);
     setUsernameSaved(true);
   } catch {
     // The mutation exposes the server error below.
   }
 };
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

        <form onSubmit={handleSaveUsername} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <label htmlFor="profile-username" className="block text-sm font-bold text-[var(--text-primary)] mb-2">Nick (nome de usuário)</label>
          <input
            id="profile-username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={draftUsername}
            disabled={settings.pending}
            aria-describedby="profile-username-hint profile-username-feedback"
            aria-invalid={Boolean(usernameError)}
            onChange={(event) => {
              setDraftUsername(event.target.value);
              setUsernameError("");
              setUsernameSaved(false);
            }}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50"
          />
          <p id="profile-username-hint" className="text-xs text-[var(--text-muted)] mt-2">Use de 3 a 30 letras sem acento, números, hífens ou sublinhados. Ao mudar o nick, o link do seu perfil também muda.</p>
          <div id="profile-username-feedback">
            {usernameError && <p role="alert" className="text-xs text-red-400 mt-2">{usernameError}</p>}
            {usernameSaved && <p role="status" className="text-xs text-[var(--yellow)] mt-2">Nick atualizado!</p>}
          </div>
          <button type="submit" disabled={settings.pending || draftUsername.trim() === username} className="mt-3 px-4 py-2 rounded-lg bg-[var(--yellow)] text-black text-sm font-semibold disabled:opacity-50">
            Salvar nick
          </button>
        </form>

        {/* Privacidade */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Privacidade</p>
          <ProfileToggle
            label="Perfil público"
            desc="Exibe a página com favoritos e atividade recente. Comentários, notas e relações de seguidores continuam públicos mesmo com o perfil privado."
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

        {settings.error && <p role="alert" className="text-red-400 mb-3">{settings.error.message}</p>}
        <PrivacyContact />
        {/* Sair */}
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full py-3 rounded-2xl border border-red-900/40 text-red-400 hover:bg-red-950/30 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {signingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </main>
    );
};

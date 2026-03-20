"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function CriarContaPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setError(error.message === "User already registered"
        ? "Este e-mail já está cadastrado."
        : "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendMsg(error ? "Erro ao reenviar. Tente novamente." : "E-mail reenviado! Verifique sua caixa de entrada.");
    setResendLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--yellow-muted)] flex items-center justify-center text-2xl">
          ✉️
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Confirme seu e-mail</h2>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Enviamos um link de confirmação para{" "}
            <strong className="text-[var(--text-secondary)]">{email}</strong>.
            Verifique sua caixa de entrada e a pasta de spam.
          </p>
        </div>

        <div className="w-full border-t border-[var(--border)] pt-4 flex flex-col gap-2">
          <p className="text-xs text-[var(--text-muted)]">Não chegou o e-mail?</p>
          {resendMsg ? (
            <p className={`text-sm ${resendMsg.startsWith("Erro") ? "text-red-500" : "text-green-500"}`}>
              {resendMsg}
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-[var(--yellow)] hover:underline disabled:opacity-50"
            >
              {resendLoading ? "Reenviando..." : "Clique aqui para reenviar"}
            </button>
          )}
        </div>

        <Link href="/login" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Criar conta</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Crie sua conta e entre no debate</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--text-secondary)]">Nome de usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seunome"
              required
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--yellow)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--text-secondary)]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--yellow)] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[var(--text-secondary)]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--yellow)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--yellow)] text-black font-semibold py-3 rounded-lg text-sm hover:bg-[var(--yellow-dim)] transition-colors disabled:opacity-60"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--text-muted)]">
          Já tem conta?{" "}
          <Link href="/login" className="text-[var(--yellow)] hover:underline">
            Entrar
          </Link>
        </p>
    </div>
  );
}

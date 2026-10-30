import Link from "next/link";
import { PRIVACY_CONTACT, privacyRequestUrl } from "../constants/privacy";

export const PrivacyContact = () => (
  <section aria-labelledby="privacy-contact-title" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 mb-4">
    <h2 id="privacy-contact-title" className="font-semibold text-[var(--text-primary)]">Seus dados e sua conta</h2>
    <p className="mt-2 text-sm text-[var(--text-muted)]">
      Para acessar, corrigir ou receber uma cópia dos seus dados, ou solicitar a exclusão da conta,
      escreva para <a className="text-[var(--yellow)] underline break-all" href={privacyRequestUrl()}>{PRIVACY_CONTACT}</a>.
      Use o e-mail cadastrado. Podemos pedir uma confirmação de identidade; nunca envie sua senha.
    </p>
    <Link href="/privacidade" className="inline-block mt-3 text-sm text-[var(--yellow)] underline">Como tratamos seus dados</Link>
  </section>
);

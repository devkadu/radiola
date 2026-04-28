import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidade — Segunda Temporada",
  description: "Artigos, análises e discussões sobre séries.",
};

export const revalidate = 300;

export default async function ComunidadePage() {
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select("id, title, subtitle, slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="px-4 lg:px-0 py-6 flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--yellow)] mb-1">Comunidade</p>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Artigos</h1>
      </div>

      {!articles?.length ? (
        <p className="text-sm text-[var(--text-muted)] py-10 text-center">Nenhum artigo publicado ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/artigos/${a.slug}`}
              className="py-4 flex flex-col gap-1 hover:opacity-80 transition-opacity"
            >
              <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">{a.title}</h2>
              {a.subtitle && (
                <p className="text-sm text-[var(--text-secondary)] leading-snug line-clamp-2">{a.subtitle}</p>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {new Date(a.published_at).toLocaleDateString("pt-BR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

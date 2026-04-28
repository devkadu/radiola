import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import { ArticleFooter } from "./ArticleFooter";

interface Props {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from("articles").select("title, seo_title, seo_description").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || undefined,
    alternates: { canonical: `${siteUrl}/artigos/${slug}` },
  };
}

export default async function ArtigoPage({ params }: Props) {
  const { slug } = await params;
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) notFound();

  return (
    <main className="px-4 lg:px-0 py-8 max-w-2xl">
      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight mb-3">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{article.subtitle}</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-4">
            {new Date(article.published_at).toLocaleDateString("pt-BR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </header>

        <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed">
          <ReactMarkdown>{article.body}</ReactMarkdown>
        </div>
      </article>

      <ArticleFooter
        articleId={article.id}
        articleTitle={article.title}
        articleUrl={`/artigos/${article.slug}`}
      />
    </main>
  );
}

import { supabaseAdmin } from "@/server/database/admin";

import { notFound } from "next/navigation";

import { ArticleEditor } from "@/features/editorial/components/article-editor/article-editor.client";

import { DeleteArticleButton } from "@/features/editorial/components/delete-article-button/delete-article-button.client";

import { requireAdmin } from "@/server/auth/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function EditArticleView({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { data: article } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!article) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Editar artigo</h1>
        <div className="flex items-center gap-3">
          {article.status === "published" && (
            <a
              href={`/artigos/${article.slug}`}
              target="_blank"
              className="text-xs text-[var(--yellow)] hover:underline"
            >
              Ver publicado ↗
            </a>
          )}
          <DeleteArticleButton id={id} />
        </div>
      </div>
      <ArticleEditor initial={article} />
    </div>
  );
}

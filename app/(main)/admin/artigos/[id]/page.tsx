import { supabaseAdmin } from "@/lib/supabase-admin";
import { notFound } from "next/navigation";
import { ArticleEditor } from "../_components/ArticleEditor";
import { DeleteArticleButton } from "./_components/DeleteArticleButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarArtigo({ params }: Props) {
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

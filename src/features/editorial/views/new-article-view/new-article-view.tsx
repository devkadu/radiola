import { ArticleEditor } from "@/features/editorial/components/article-editor/article-editor.client";

import { requireAdmin } from "@/server/auth/auth";

export async function NewArticleView() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Novo artigo</h1>
      <ArticleEditor />
    </div>
  );
}

import { ArticleEditor } from "../_components/ArticleEditor";

export default function NovoArtigo() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Novo artigo</h1>
      <ArticleEditor />
    </div>
  );
}

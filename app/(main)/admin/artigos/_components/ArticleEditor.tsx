"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Article {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  body: string;
  status: "draft" | "published" | "archived";
  seo_title: string;
  seo_description: string;
}

interface Props {
  initial?: Partial<Article>;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ArticleEditor({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<Article>({
    title: initial?.title ?? "",
    subtitle: initial?.subtitle ?? "",
    slug: initial?.slug ?? "",
    body: initial?.body ?? "",
    status: initial?.status ?? "draft",
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
  });
  const [error, setError] = useState("");

  const set = (field: keyof Article, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: f.slug === slugify(f.title) || !f.slug ? slugify(value) : f.slug,
    }));
  };

  const save = (status: Article["status"]) => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/articles", {
        method: initial?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status, id: initial?.id }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setError(error ?? "Erro ao salvar.");
        return;
      }
      const data = await res.json();
      router.push(`/admin/artigos/${data.id}`);
    });
  };

  const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--yellow)]/50";

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setPreview((p) => !p)}
          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {preview ? "← Editar" : "Preview →"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            onClick={() => save("draft")}
            disabled={pending}
            className="text-xs px-4 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            Salvar rascunho
          </button>
          <button
            onClick={() => save("published")}
            disabled={pending}
            className="text-xs px-4 py-1.5 rounded-lg bg-[var(--yellow)] text-black font-bold hover:bg-[var(--yellow-dim)] transition-colors disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Publicar"}
          </button>
        </div>
      </div>

      {!preview ? (
        <div className="flex flex-col gap-4">
          {/* Título */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Título</label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do artigo"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Subtítulo</label>
            <input
              className={inputCls}
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Subtítulo opcional"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Slug</label>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="slug-do-artigo"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">/artigos/{form.slug || "…"}</p>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Conteúdo (Markdown)</label>
            <textarea
              className={`${inputCls} font-mono text-xs leading-relaxed resize-none`}
              rows={20}
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              placeholder="# Título&#10;&#10;Escreva em Markdown..."
            />
          </div>

          {/* SEO */}
          <details className="rounded-lg border border-[var(--border)] p-4">
            <summary className="text-xs font-semibold text-[var(--text-muted)] cursor-pointer">SEO</summary>
            <div className="flex flex-col gap-3 mt-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Título SEO</label>
                <input className={inputCls} value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Descrição SEO</label>
                <input className={inputCls} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{form.seo_description.length}/160</p>
              </div>
            </div>
          </details>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{form.title || "Sem título"}</h1>
          {form.subtitle && <p className="text-[var(--text-secondary)] mb-4">{form.subtitle}</p>}
          <div className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] whitespace-pre-wrap font-mono text-xs">
            {form.body || "Sem conteúdo."}
          </div>
        </div>
      )}
    </div>
  );
}

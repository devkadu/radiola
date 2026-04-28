"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Deletar este artigo? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await fetch("/api/admin/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.push("/admin/artigos");
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      {pending ? "Deletando…" : "Deletar"}
    </button>
  );
}

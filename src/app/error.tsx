"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error({ operation: "page-render", digest: error.digest }); }, [error]);
  return <main className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-xl font-bold">Não foi possível carregar esta página</h1><p>Tente novamente em alguns instantes.</p><button className="rounded-xl bg-[var(--yellow)] px-5 py-3 text-black" onClick={reset}>Tentar novamente</button></main>;
}

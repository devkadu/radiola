import Link from "next/link";
export default function NotFound() {
  return <main className="min-h-[60dvh] flex flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-bold">Página não encontrada</h1><Link href="/" className="text-[var(--yellow)] underline">Voltar ao início</Link></main>;
}

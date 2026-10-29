import Link from "next/link";

const ProfileNotFound = () => (
  <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-(--text-muted)">
    <span aria-hidden className="text-4xl">
      👤
    </span>
    <h1 className="text-lg font-semibold text-(--text-primary)">Usuário não encontrado</h1>
    <Link href="/" className="text-sm text-(--yellow) hover:underline">
      ← Voltar
    </Link>
  </main>
);

export default ProfileNotFound;

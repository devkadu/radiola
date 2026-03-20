import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 py-5">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          radio<span className="text-[var(--yellow)]">la</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

export function BuscaInput({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (v: string) => {
    const trimmed = v.trim();
    if (trimmed) router.push(`/busca?q=${encodeURIComponent(trimmed)}`);
    else router.push("/busca");
  };

  const clear = () => {
    setValue("");
    inputRef.current?.focus();
    router.push("/busca");
  };

  return (
    <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 focus-within:border-[var(--yellow)]/50 transition-colors">
      <FaMagnifyingGlass size={14} className="text-[var(--text-muted)] shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit(value)}
        placeholder="Buscar série, episódio..."
        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
      />
      {value && (
        <button onClick={clear} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0">
          <FaXmark size={14} />
        </button>
      )}
    </div>
  );
}

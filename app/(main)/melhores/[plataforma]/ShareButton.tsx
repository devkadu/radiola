"use client";
import { useState } from "react";
import { FaShareNodes, FaCheck } from "react-icons/fa6";

interface Props {
  title: string;
  url: string;
}

export function ShareButton({ title, url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = `${window.location.origin}${url}`;
    if (navigator.share) {
      await navigator.share({ title, url: fullUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--yellow)]/40 transition-colors"
    >
      {copied ? <FaCheck size={13} className="text-emerald-400" /> : <FaShareNodes size={13} />}
      {copied ? "Copiado!" : "Compartilhar lista"}
    </button>
  );
}

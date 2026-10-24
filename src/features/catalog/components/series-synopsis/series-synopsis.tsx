"use client";

export function CollapsibleSinopse({ overview }: { overview: string }) {
  return (
    <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
      {overview}
    </p>
  );
}

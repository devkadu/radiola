"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearTimeout(tickRef.current);
  };

  // Quando pathname muda → navegação completou
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    clear();
    setWidth(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 400);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      clear();
      setVisible(true);
      setWidth(20);

      // Simula progresso incremental até ~85%
      const increments = [40, 60, 75, 85];
      const delays = [200, 500, 1000, 2500];
      delays.forEach((delay, i) => {
        tickRef.current = setTimeout(() => setWidth(increments[i]), delay);
      });
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clear();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-[var(--yellow)]"
      style={{
        width: `${width}%`,
        transition: width === 100 ? "width 200ms ease-out" : "width 400ms ease-in-out",
        opacity: width === 100 ? 0 : 1,
      }}
    />
  );
}

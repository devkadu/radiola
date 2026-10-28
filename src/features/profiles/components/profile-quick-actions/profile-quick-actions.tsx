"use client";

import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { useSignOut } from "@/features/auth/hooks/use-sign-out";
import { ROUTES } from "@/shared/constants/routes";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { FaArrowRightFromBracket, FaListUl } from "react-icons/fa6";

export const ProfileQuickActions = ({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}) => {
  const { user } = useAuth();
  const { handleSignOut, signingOut, signOutError } = useSignOut();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const menuId = useId();
  const hintId = useId();

  const cancelPress = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    originRef.current = null;
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const dismissOutside = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const dismissOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      linkRef.current?.focus();
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  const startPress = (event: PointerEvent<HTMLAnchorElement>) => {
    cancelPress();
    suppressClickRef.current = false;
    if (!user || event.button !== 0 || !event.isPrimary) return;
    originRef.current = { x: event.clientX, y: event.clientY };
    timerRef.current = setTimeout(() => {
      suppressClickRef.current = true;
      setOpen(true);
      timerRef.current = null;
    }, 500);
  };

  const movePress = (event: PointerEvent<HTMLAnchorElement>) => {
    const origin = originRef.current;
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 10) {
      suppressClickRef.current = true;
      cancelPress();
    }
  };

  const navigateMenu = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = (index + 1) % items.length;
        break;
      case "ArrowUp":
        next = (index - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    items[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <Link
        ref={linkRef}
        href={ROUTES.profile}
        aria-label="Perfil"
        aria-current={active ? "page" : undefined}
        aria-haspopup={user ? "menu" : undefined}
        aria-expanded={user ? open : undefined}
        aria-controls={open ? menuId : undefined}
        aria-describedby={user ? hintId : undefined}
        draggable={false}
        className="flex min-h-11 min-w-11 touch-manipulation select-none flex-col items-center gap-0.5 px-2 py-1"
        style={{ WebkitTouchCallout: "none" }}
        onPointerDown={startPress}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerCancel={() => {
          suppressClickRef.current = true;
          cancelPress();
        }}
        onPointerLeave={cancelPress}
        onClick={(event) => {
          if (suppressClickRef.current && event.detail !== 0) event.preventDefault();
          else setOpen(false);
        }}
        onContextMenu={(event) => {
          if (!user) return;
          event.preventDefault();
          cancelPress();
          suppressClickRef.current = true;
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (user && (event.key === "ArrowDown" || (event.shiftKey && event.key === "F10"))) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
      </Link>
      {user && (
        <span id={hintId} className="sr-only">
          Toque para abrir o perfil. Segure para ver ações rápidas, ou use a seta para baixo no
          teclado.
        </span>
      )}
      {user && open && (
        <div className="absolute bottom-full right-0 mb-3 w-48 rounded-2xl border border-(--border) bg-(--bg-surface) p-1.5 text-sm shadow-xl">
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Ações do perfil"
            onKeyDown={navigateMenu}
          >
            <a
              href={`${ROUTES.profile}#minha-lista`}
              role="menuitem"
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-(--text-primary) hover:bg-(--bg-elevated) focus-visible:bg-(--bg-elevated) focus-visible:outline-none"
              onClick={() => setOpen(false)}
            >
              <FaListUl aria-hidden size={15} /> Minha lista
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-red-400 hover:bg-red-950/30 focus-visible:bg-red-950/30 focus-visible:outline-none disabled:opacity-50"
            >
              <FaArrowRightFromBracket aria-hidden size={15} />
              {signingOut ? "Saindo…" : "Sair"}
            </button>
          </div>
          {signOutError && (
            <p role="alert" className="px-3 py-2 text-xs text-red-400">
              {signOutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

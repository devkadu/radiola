"use client";

import { useEffect,useRef,useState } from "react";

export function useProfileShare(username: string) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const share = async () => {
    setError(null);
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
    try {
      if (navigator.share) await navigator.share({ title: "Segunda Temporada", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError("Não foi possível compartilhar o perfil.");
      }
    }
  };
  return { share, copied, error };
}

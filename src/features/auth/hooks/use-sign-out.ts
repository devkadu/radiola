"use client";

import { ROUTES } from "@/shared/constants/routes";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "../components/auth-provider/auth-provider.client";

export const useSignOut = () => {
  const { signOut } = useAuth();
  const router = useRouter();
  const inFlight = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      router.push(ROUTES.home);
      router.refresh();
    } catch {
      setSignOutError("Não foi possível sair. Tente novamente.");
    } finally {
      inFlight.current = false;
      setSigningOut(false);
    }
  };

  return { handleSignOut, signingOut, signOutError };
};

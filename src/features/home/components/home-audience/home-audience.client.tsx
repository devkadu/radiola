"use client";
import { getProfileUsername } from "@/features/profiles/functions/get-profile-username";

import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { PersonalizedHome } from "@/features/home/components/personalized-home/personalized-home";
import type { ReactNode } from "react";

// Only the personal island depends on the session. The public page can use ISR.
export const HomeIntro = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  // Keep the public hero in the initial HTML for readers and search engines.
  if (loading || !user) return children;
  const username =
    getProfileUsername(user);
  return <PersonalizedHome key={user.id} username={username} />;
}

export function HomeGuestContent({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return !user ? children : null;
}

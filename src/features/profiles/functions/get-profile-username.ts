import type { User } from "@supabase/supabase-js";

export const getProfileUsername = (user: Pick<User, "id" | "user_metadata">): string => {
  const username = user.user_metadata?.username;
  return typeof username === "string" && username.trim()
    ? username.trim().slice(0, 80)
    : `usuario-${user.id.replaceAll("-", "").slice(0, 12)}`;
};

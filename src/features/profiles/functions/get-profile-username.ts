import type { User } from "@supabase/supabase-js";

export const getProfileUsername = (user: Pick<User, "user_metadata" | "email">): string => {
  const username = user.user_metadata?.username;
  return typeof username === "string" && username.trim()
    ? username
    : user.email?.split("@")[0] ?? "";
};

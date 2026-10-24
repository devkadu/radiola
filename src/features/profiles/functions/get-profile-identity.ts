import type { User } from "@supabase/supabase-js";
import type { ProfileIdentity } from "../types/profile";
import { getProfileUsername } from "./get-profile-username";

export const getProfileIdentity = (user: User): ProfileIdentity => {
  const metadata = user.user_metadata;
  return {
    id: user.id,
    username: getProfileUsername(user) || "usuário",
    createdAt: user.created_at,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
    preferences: {
      notify_replies: metadata.notify_replies !== false,
      notify_weekly: metadata.notify_weekly === true,
      notify_premiere: metadata.notify_premiere !== false,
      profile_public: metadata.profile_public !== false,
    },
  };
};

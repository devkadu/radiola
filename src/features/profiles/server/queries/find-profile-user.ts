import "server-only";

import { getProfileUsername } from "@/features/profiles/functions/get-profile-username";
import { supabaseAdmin } from "@/server/database/admin";
import type { User } from "@supabase/supabase-js";

export const findProfileUser = async (username: string): Promise<User | null> => {
  if (!username) return null;

  const { data, error } = await supabaseAdmin.from("profile_directory")
    .select("user_id").eq("username", username)
    .order("created_at").order("user_id").limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Read current Auth metadata: privacy changes must not wait for a cached index.
  const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.user_id);
  if (userError) {
    if (userError.status === 404) return null;
    throw userError;
  }
  // A rename/delete may commit between the indexed lookup and the Auth request.
  return user && getProfileUsername(user) === username ? user : null;
};

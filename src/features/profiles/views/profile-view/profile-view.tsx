import { createClient } from "@/server/database/session";

import { redirect } from "next/navigation";

import { ProfileClient } from "@/features/profiles/components/profile-dashboard/profile-dashboard.client";
import { getProfileIdentity } from "@/features/profiles/functions/get-profile-identity";
import { isAdminUser } from "@/server/auth/admin-guard";


export async function ProfileView() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = isAdminUser(user.id, process.env.ADMIN_USER_ID);

  return <ProfileClient key={user.id} profile={getProfileIdentity(user)} isAdmin={isAdmin} />;
}

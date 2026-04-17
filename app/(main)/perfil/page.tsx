import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <ProfileClient user={user} />;
}

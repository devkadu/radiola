import "server-only";

import { isAdminUser } from "@/server/auth/admin-guard";
import { createClient } from "@/server/database/session";

export class AccessError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message);
    this.name = "AccessError";
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new AccessError(401, "Não autorizado");
  return { user, supabase };
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!isAdminUser(session.user.id, process.env.ADMIN_USER_ID)) {
    throw new AccessError(403, "Acesso restrito à administração");
  }
  return session;
}

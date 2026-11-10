import { profileSettingsSchema } from "@/features/profiles/schemas/profile-settings.schema";
import { requireUser } from "@/server/auth/auth";
import { supabaseAdmin } from "@/server/database/admin";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { NextRequest,NextResponse } from "next/server";
import "server-only";

const isUsernameTaken = async (username: string, userId: string) => {
  const { data, error } = await supabaseAdmin.from("profile_directory")
    .select("user_id")
    .ilike("username", username.replaceAll("_", "\\_"))
    .neq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

const usernameConflict = () => NextResponse.json(
  { error: "Este nick já está em uso. Escolha outro." },
  { status: 409, headers: { "Cache-Control": "private, no-store" } },
);

export const PATCH = async (request: NextRequest) => {
  try {
    const { user, supabase } = await requireUser();
    const updates = profileSettingsSchema.parse(await readJson(request));
    if (updates.username !== undefined && await isUsernameTaken(updates.username, user.id)) {
      return usernameConflict();
    }
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) {
      // A concurrent rename can claim the name after the availability check.
      if (updates.username !== undefined && await isUsernameTaken(updates.username, user.id)) {
        return usernameConflict();
      }
      throw error;
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, "profile.settings");
  }
};

import { profileSettingsSchema } from "@/features/profiles/schemas/profile-settings.schema";
import { requireUser } from "@/server/auth/auth";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { NextRequest,NextResponse } from "next/server";
import "server-only";

export async function PATCH(request: NextRequest) {
  try {
    const { supabase } = await requireUser();
    const updates = profileSettingsSchema.parse(await readJson(request));
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, "profile.settings");
  }
}

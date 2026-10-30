import { requireAdmin } from "@/server/auth/auth";
import { supabaseAdmin } from "@/server/database/admin";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const moderationSchema = z.object({
  reportId: z.uuid(),
  commentId: z.uuid(),
  action: z.enum(["dismiss", "delete"]),
});

export const POST = async (req: NextRequest) => {
  try {
    await requireAdmin();
    const { reportId, commentId, action } = moderationSchema.parse(await readJson(req));
    const { error } = await supabaseAdmin.rpc("moderate_comment", {
      p_report_id: reportId, p_comment_id: commentId, p_action: action,
    });
    if (error?.code === "P0002") return NextResponse.json({ error: "Denúncia não encontrada" }, { status: 404 });
    if (error?.code === "22023") return NextResponse.json({ error: "Denúncia não corresponde ao comentário" }, { status: 400 });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "admin.moderation");
  }
}

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

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { reportId, commentId, action } = moderationSchema.parse(await readJson(req));
    const { data: report, error: readError } = await supabaseAdmin
      .from("moderation_queue").select("comment_id").eq("id", reportId).single();
    if (readError) throw readError;
    if (!report || report.comment_id !== commentId) {
      return NextResponse.json({ error: "Denúncia não corresponde ao comentário" }, { status: 400 });
    }
    if (action === "delete") {
      const { error } = await supabaseAdmin.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    }
    const { error } = await supabaseAdmin.from("moderation_queue")
      .update({ status: action === "delete" ? "actioned" : "reviewed" }).eq("id", reportId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "admin.moderation");
  }
}

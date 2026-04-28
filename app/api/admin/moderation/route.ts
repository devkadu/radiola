import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId, commentId, action } = await req.json();

  if (action === "delete") {
    await supabaseAdmin.from("comments").delete().eq("id", commentId);
  }

  await supabaseAdmin
    .from("moderation_queue")
    .update({ status: action === "delete" ? "actioned" : "reviewed" })
    .eq("id", reportId);

  return NextResponse.json({ ok: true });
}

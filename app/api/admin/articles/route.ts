import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id !== process.env.ADMIN_USER_ID) throw new Error("Unauthorized");
}

export async function POST(req: NextRequest) {
  try {
    await assertAdmin();
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("articles")
      .insert({
        title: body.title,
        subtitle: body.subtitle || null,
        slug: body.slug,
        body: body.body,
        status: body.status,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        published_at: body.status === "published" ? new Date().toISOString() : null,
        author_id: process.env.ADMIN_USER_ID,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await assertAdmin();
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("articles")
      .update({
        title: body.title,
        subtitle: body.subtitle || null,
        slug: body.slug,
        body: body.body,
        status: body.status,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        published_at: body.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await assertAdmin();
    const { id } = await req.json();
    await supabaseAdmin.from("articles").delete().eq("id", id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

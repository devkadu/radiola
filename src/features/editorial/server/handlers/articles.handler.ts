import { articleSchema } from "@/features/editorial/schemas/article.schema";
import { requireAdmin } from "@/server/auth/auth";
import { supabaseAdmin } from "@/server/database/admin";
import { apiError } from "@/server/http/api-error";
import { readJson } from "@/server/http/read-json";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAdmin();
    const body = articleSchema.parse(await readJson(req));
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
        author_id: user.id,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (error) {
    return apiError(error, "editorial.articles");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = articleSchema.extend({ id: z.uuid() }).parse(await readJson(req));
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
  } catch (error) {
    return apiError(error, "editorial.articles");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { id } = z.object({ id: z.uuid() }).strict().parse(await readJson(req));
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error, "editorial.articles");
  }
}

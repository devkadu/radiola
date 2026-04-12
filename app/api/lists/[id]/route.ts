import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/lists/[id] — retorna lista com suas séries
export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { data: list } = await supabase
    .from("user_lists")
    .select("id, name, is_public")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!list) return NextResponse.json(null, { status: 404 });

  const { data: series } = await supabase
    .from("user_list_series")
    .select("series_id, series_name, poster_path, series_slug, added_at")
    .eq("list_id", id)
    .order("added_at", { ascending: false });

  return NextResponse.json({ ...list, series: series ?? [] });
}

// DELETE /api/lists/[id] — remove a lista
export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase
    .from("user_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

import { createClient } from "@/server/database/session";
import { NextRequest, NextResponse } from "next/server";
import "server-only";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/lists/[id] — retorna lista com suas séries
export const GET = async (_req: NextRequest, { params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json(null, { status: 401 });

  const { data: list, error: listError } = await supabase
    .from("user_lists")
    .select("id, name, is_public")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listError) throw listError;
  if (!list) return NextResponse.json(null, { status: 404 });

  const { data: series, error: seriesError } = await supabase
    .from("user_list_series")
    .select("series_id, series_name, poster_path, series_slug, added_at")
    .eq("list_id", id)
    .order("added_at", { ascending: false });

  if (seriesError) throw seriesError;
  return NextResponse.json(
    { ...list, series: series ?? [] },
    {
      headers: { "Cache-Control": "private, no-store" },
    },
  );
};

// DELETE /api/lists/[id] — remove a lista
export const DELETE = async (_req: NextRequest, { params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { error } = await supabase.from("user_lists").delete().eq("id", id).eq("user_id", user.id);

  if (error) throw error;
  return new NextResponse(null, { status: 204 });
};

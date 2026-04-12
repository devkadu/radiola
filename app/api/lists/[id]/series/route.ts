import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/lists/[id]/series — adiciona uma série à lista
export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verifica que a lista pertence ao usuário
  const { data: list } = await supabase
    .from("user_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });

  const { series_id, series_name, poster_path, series_slug } = await req.json();
  if (!series_id || !series_name || !series_slug) {
    return NextResponse.json({ error: "Dados insuficientes" }, { status: 400 });
  }

  const { error } = await supabase.from("user_list_series").upsert({
    list_id: id,
    series_id,
    series_name,
    poster_path: poster_path ?? null,
    series_slug,
  }, { onConflict: "list_id,series_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

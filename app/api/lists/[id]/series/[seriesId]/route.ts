import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Props {
  params: Promise<{ id: string; seriesId: string }>;
}

// DELETE /api/lists/[id]/series/[seriesId] — remove série da lista
export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id, seriesId } = await params;
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

  const { error } = await supabase
    .from("user_list_series")
    .delete()
    .eq("list_id", id)
    .eq("series_id", parseInt(seriesId));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

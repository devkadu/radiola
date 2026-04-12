import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const MAX_LISTS = 3;

// GET /api/lists — retorna listas do usuário com contagem de séries
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data } = await supabase
    .from("user_lists")
    .select("id, name, is_public, created_at, user_list_series(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const lists = (data ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    is_public: l.is_public,
    created_at: l.created_at,
    series_count: l.user_list_series[0]?.count ?? 0,
  }));

  return NextResponse.json(lists);
}

// POST /api/lists — cria uma lista (nome no body)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (name.trim().length > 50) return NextResponse.json({ error: "Nome muito longo" }, { status: 400 });

  // Verifica limite
  const { count } = await supabase
    .from("user_lists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= MAX_LISTS) {
    return NextResponse.json({ error: `Limite de ${MAX_LISTS} listas atingido` }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("user_lists")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, series_count: 0 }, { status: 201 });
}

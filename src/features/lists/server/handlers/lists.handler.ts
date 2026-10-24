import { createClient } from "@/server/database/session";
import { readJson } from "@/server/http/read-json";
import { NextRequest,NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

const MAX_LISTS = 3;

// GET /api/lists — retorna listas do usuário com contagem de séries
export const GET = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data, error } = await supabase
    .from("user_lists")
    .select("id, name, is_public, created_at, user_list_series(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const lists = (data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    is_public: l.is_public,
    created_at: l.created_at,
    series_count: l.user_list_series[0]?.count ?? 0,
  }));

  return NextResponse.json(lists, { headers: { "Cache-Control": "private, no-store" } });
};

// POST /api/lists — cria uma lista (nome no body)
export const POST = async (req: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { name } = z.object({ name: z.string().trim().min(1).max(50) }).strict().parse(await readJson(req));
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (name.trim().length > 50) return NextResponse.json({ error: "Nome muito longo" }, { status: 400 });

  // Verifica limite
  const { count, error: countError } = await supabase
    .from("user_lists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) throw countError;
  if (count === null) throw new Error("List quota was not returned");

  if (count >= MAX_LISTS) {
    return NextResponse.json({ error: `Limite de ${MAX_LISTS} listas atingido` }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("user_lists")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (error) throw error;
  return NextResponse.json({ ...data, series_count: 0 }, {
    status: 201, headers: { "Cache-Control": "private, no-store" },
  });
};

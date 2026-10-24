import { createClient } from "@/server/database/session";
import { readJson } from "@/server/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/lists/[id]/series — adiciona uma série à lista
export const POST = async (req: NextRequest, { params }: Props) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Verifica que a lista pertence ao usuário
  const { data: list, error: listError } = await supabase
    .from("user_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listError) throw listError;
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });

  const { series_id, series_name, poster_path, series_slug } = z
    .object({
      series_id: z.number().int().positive(),
      series_name: z.string().trim().min(1).max(200),
      poster_path: z.string().max(300).nullable().optional(),
      series_slug: z
        .string()
        .min(1)
        .max(300)
        .regex(/^[a-z0-9-]+$/),
    })
    .strict()
    .parse(await readJson(req));
  if (!series_id || !series_name || !series_slug) {
    return NextResponse.json({ error: "Dados insuficientes" }, { status: 400 });
  }

  const { error } = await supabase.from("user_list_series").upsert(
    {
      list_id: id,
      series_id,
      series_name,
      poster_path: poster_path ?? null,
      series_slug,
    },
    { onConflict: "list_id,series_id", ignoreDuplicates: true },
  );

  if (error) throw error;
  return new NextResponse(null, { status: 204 });
};

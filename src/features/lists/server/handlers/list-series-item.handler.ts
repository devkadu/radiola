import { createClient } from "@/server/database/session";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

interface Props {
  params: Promise<{ id: string; seriesId: string }>;
}

// DELETE /api/lists/[id]/series/[seriesId] — remove série da lista
export const DELETE = async (_req: NextRequest, { params }: Props) => {
  const { id, seriesId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const parsedSeriesId = z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().positive().max(2_147_483_647))
    .parse(seriesId);

  // Verifica que a lista pertence ao usuário
  const { data: list, error: listError } = await supabase
    .from("user_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (listError) throw listError;
  if (!list) return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 });

  const { error } = await supabase
    .from("user_list_series")
    .delete()
    .eq("list_id", id)
    .eq("series_id", parsedSeriesId);

  if (error) throw error;
  return new NextResponse(null, { status: 204 });
};

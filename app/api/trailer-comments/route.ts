import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get("series_id");
  const youtubeKey = searchParams.get("youtube_key");

  if (!seriesId || !youtubeKey) {
    return NextResponse.json({ error: "series_id e youtube_key são obrigatórios" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("trailer_comments")
    .select("*")
    .eq("series_id", seriesId)
    .eq("youtube_key", youtubeKey)
    .order("timestamp_sec", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { series_id, youtube_key, timestamp_sec, text } = body;

  if (!series_id || !youtube_key || timestamp_sec == null || !text?.trim()) {
    return NextResponse.json({ error: "campos obrigatórios ausentes" }, { status: 400 });
  }

  if (typeof timestamp_sec !== "number" || timestamp_sec < 0) {
    return NextResponse.json({ error: "timestamp_sec inválido" }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim().length > 500) {
    return NextResponse.json({ error: "texto inválido" }, { status: 400 });
  }

  const username = user.user_metadata?.username || user.email?.split("@")[0] || "anon";
  const avatarUrl = user.user_metadata?.avatar_url ?? null;

  const { data, error } = await supabaseAdmin
    .from("trailer_comments")
    .insert({ series_id, youtube_key, user_id: user.id, username, avatar_url: avatarUrl, timestamp_sec, text: text.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("trailer_comments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

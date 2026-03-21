import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from("comments")
    .select("user_id, username, avatar_url")
    .gte("created_at", since.toISOString());

  if (error || !data) return NextResponse.json([]);

  // Aggregate by user
  const map = new Map<string, { username: string; avatar_url: string | null; count: number }>();
  for (const row of data) {
    const existing = map.get(row.user_id);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(row.user_id, { username: row.username, avatar_url: row.avatar_url, count: 1 });
    }
  }

  const top = Array.from(map.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([user_id, v], i) => ({
      rank: i + 1,
      user_id,
      username: v.username,
      avatar_url: v.avatar_url,
      comments: v.count,
    }));

  return NextResponse.json(top);
}

import { createClient } from "@/lib/supabase-browser";

export interface TrailerComment {
  id: string;
  series_id: string;
  youtube_key: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  timestamp_sec: number;
  text: string;
  likes: number;
  created_at: string;
}

export const trailerCommentsService = {
  async getComments(seriesId: string, youtubeKey: string): Promise<TrailerComment[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("trailer_comments")
      .select("*")
      .eq("series_id", seriesId)
      .eq("youtube_key", youtubeKey)
      .order("timestamp_sec", { ascending: true });
    return data ?? [];
  },

  async addComment(
    seriesId: string,
    youtubeKey: string,
    userId: string,
    username: string,
    avatarUrl: string | null,
    timestampSec: number,
    text: string,
  ): Promise<TrailerComment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("trailer_comments")
      .insert({
        series_id: seriesId,
        youtube_key: youtubeKey,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        timestamp_sec: timestampSec,
        text,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("trailer_comments").delete().eq("id", id);
  },
};

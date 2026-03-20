import { createClient } from "@/lib/supabase-browser";

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  text: string;
  likes: number;
  created_at: string;
}

export function episodeId(seriesId: string, season: number, episode: number) {
  return `${seriesId}-s${season}-e${episode}`;
}

export const commentsService = {
  async getComments(epId: string): Promise<Comment[]> {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("episode_id", epId)
      .order("created_at", { ascending: false });
    return data ?? [];
  },

  async addComment(epId: string, userId: string, username: string, avatarUrl: string | null, text: string): Promise<Comment> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ episode_id: epId, user_id: userId, username, avatar_url: avatarUrl, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", id);
  },
};

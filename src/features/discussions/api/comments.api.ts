import { createClient } from "@/shared/lib/supabase-browser";
import { commentInputSchema } from "../schemas/comment.schema";

export interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  text: string;
  likes: number;
  created_at: string;
  parent_id: string | null;
}

export const commentsService = {
  getComments: async (epId: string): Promise<Comment[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .select("id, user_id, username, avatar_url, text, likes, created_at, parent_id")
      .eq("episode_id", epId)
      .order("created_at", { ascending: true }).order("id");
    if (error) throw error;
    return data ?? [];
  },

  addComment: async (
    epId: string,
    userId: string,
    text: string,
    parentId?: string | null,
  ): Promise<Comment> => {
    const input = commentInputSchema.parse({ episode_id: epId, user_id: userId, text, parent_id: parentId ?? null });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteComment: async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
  },
};

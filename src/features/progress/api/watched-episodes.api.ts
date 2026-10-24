import { createClient } from "@/shared/lib/supabase-browser";

export const watchedEpisodesService = {
  async isWatched(userId: string, episodeId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("watched_episodes")
      .select("id")
      .eq("user_id", userId)
      .eq("episode_id", episodeId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async markWatched(userId: string, episodeId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("watched_episodes").upsert(
      { user_id: userId, episode_id: episodeId },
      { onConflict: "user_id,episode_id", ignoreDuplicates: true }
    );
    if (error) throw error;
  },
};

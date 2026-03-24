import { createClient } from "@/lib/supabase-browser";

export const watchedEpisodesService = {
  async isWatched(userId: string, episodeId: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from("watched_episodes")
      .select("id")
      .eq("user_id", userId)
      .eq("episode_id", episodeId)
      .maybeSingle();
    return !!data;
  },

  async markWatched(userId: string, episodeId: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("watched_episodes").upsert(
      { user_id: userId, episode_id: episodeId },
      { onConflict: "user_id,episode_id", ignoreDuplicates: true }
    );
  },
};

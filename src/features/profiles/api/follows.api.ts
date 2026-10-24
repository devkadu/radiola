import { createClient } from "@/shared/lib/supabase-browser";

export const followsService = {
  async getFollowerCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId);
    if (error) throw error;
    return count ?? 0;
  },

  async getFollowingCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId);
    if (error) throw error;
    return count ?? 0;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async follow(followerId: string, followingId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("follows").delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  },
};

import { createClient } from "@/lib/supabase-browser";

export const followsService = {
  async getFollowerCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId);
    return count ?? 0;
  },

  async getFollowingCount(userId: string): Promise<number> {
    const supabase = createClient();
    const { count } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId);
    return count ?? 0;
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .single();
    return !!data;
  },

  async follow(followerId: string, followingId: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("follows").delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
  },
};

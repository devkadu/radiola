import { createClient } from "@/shared/lib/supabase-browser";

export const favoritesService = {
  async getFavorites(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_series")
      .select("series_id, series_name, series_slug, poster_path")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async isFavorited(userId: string, seriesId: number) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_series")
      .select("id")
      .eq("user_id", userId)
      .eq("series_id", seriesId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async add(userId: string, series: { id: number; name: string; slug: string; poster_path: string | null }) {
    const supabase = createClient();
    const { error } = await supabase.from("user_series").insert({
      user_id: userId,
      series_id: series.id,
      series_name: series.name,
      series_slug: series.slug,
      poster_path: series.poster_path,
    });
    if (error) throw error;
  },

  async remove(userId: string, seriesId: number) {
    const supabase = createClient();
    const { error } = await supabase
      .from("user_series")
      .delete()
      .eq("user_id", userId)
      .eq("series_id", seriesId);
    if (error) throw error;
  },
};

"use client";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { watchedEpisodesService } from "../api/watched-episodes.api";

export function useWatchedEpisode(episodeId: string) {
  const { user, loading } = useAuth();
  const client = useQueryClient();
  const key = ["profile", user?.id, "watched", episodeId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => watchedEpisodesService.isWatched(user!.id, episodeId),
    enabled: !!user && !loading,
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Entre para marcar um episódio como assistido.");
      await watchedEpisodesService.markWatched(user.id, episodeId);
    },
    onSuccess: async () => {
      client.setQueryData(key, true);
      await client.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
  return {
    watched: loading || (user && query.isPending) ? null : user ? query.data ?? false : false,
    marking: mutation.isPending,
    mark: () => mutation.mutate(),
    error: mutation.error ?? query.error,
  };
}

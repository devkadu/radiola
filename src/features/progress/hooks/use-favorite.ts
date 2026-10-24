"use client";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";
import { endpoints } from "@/shared/constants/endpoint";
import { fetchJson } from "@/shared/http/fetch-json";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "../api/favorites.api";

export function useFavorite(seriesId: number) {
  const { user, loading: authLoading } = useAuth();
  const client = useQueryClient();
  const key = ["profile", user?.id, "favorite", seriesId];
  const query = useQuery({ queryKey: key, queryFn: () => favoritesService.isFavorited(user!.id, seriesId), enabled: !!user });
  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!user) throw new Error("Entre para salvar séries.");
      await fetchJson(endpoints.INTERNAL.FAVORITES, {
        method: next ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seriesId }),
      });
      return next;
    },
    onSuccess: async next => {
      client.setQueryData(key, next);
      await client.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
  return { favorited: !!user && !!query.data, loading: authLoading || (!!user && query.isPending), toggle: mutation.mutateAsync, pending: mutation.isPending, error: mutation.error ?? query.error };
}

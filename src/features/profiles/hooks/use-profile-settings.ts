"use client";
import { endpoints } from "@/shared/constants/endpoint";
import { useAuth } from "@/features/auth/components/auth-provider/auth-provider.client";

import { fetchJson } from "@/shared/http/fetch-json";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProfilePreferences } from "../types/profile";
import type { ProfileSettingsUpdates } from "../schemas/profile-settings.schema";

export const useProfileSettings = (initial: ProfilePreferences, initialUsername: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [preferences, setPreferences] = useState(initial);
  const [username, setUsername] = useState(initialUsername);
  const mutation = useMutation({
    mutationFn: (updates: ProfileSettingsUpdates) => fetchJson(endpoints.INTERNAL.PROFILE_SETTINGS, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    }),
    onSuccess: (_, { username: nextUsername, ...updates }) => {
      setPreferences((current) => ({ ...current, ...updates }));
      if (nextUsername !== undefined) {
        setUsername(nextUsername);
        // The save has committed; a failed refresh must not report a failed save.
        void refreshUser().catch(() => {});
        void queryClient.invalidateQueries();
        router.refresh();
      }
    },
  });
  const toggle = (name: keyof ProfilePreferences) => {
    if (!mutation.isPending) mutation.mutate({ [name]: !preferences[name] });
  };
  const saveUsername = async (nextUsername: string) => {
    await mutation.mutateAsync({ username: nextUsername });
  };
  return { preferences, username, saveUsername, toggle, pending: mutation.isPending, error: mutation.error };
};

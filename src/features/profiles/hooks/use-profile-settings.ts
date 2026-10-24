"use client";
import { endpoints } from "@/shared/constants/endpoint";

import { fetchJson } from "@/shared/http/fetch-json";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { ProfilePreferences } from "../types/profile";

export function useProfileSettings(initial: ProfilePreferences) {
  const [preferences, setPreferences] = useState(initial);
  const mutation = useMutation({
    mutationFn: (updates: Partial<ProfilePreferences>) => fetchJson(endpoints.INTERNAL.PROFILE_SETTINGS, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates),
    }),
    onSuccess: (_, updates) => setPreferences((current) => ({ ...current, ...updates })),
  });
  const toggle = (name: keyof ProfilePreferences) => {
    if (!mutation.isPending) mutation.mutate({ [name]: !preferences[name] });
  };
  return { preferences, toggle, pending: mutation.isPending, error: mutation.error };
}

"use client";
import { endpoints } from "@/shared/constants/endpoint";

import { fetchJson } from "@/shared/http/fetch-json";
import { useQuery } from "@tanstack/react-query";
import type { ProfileOverview } from "../types/profile";

export function useProfileOverview(userId: string) {
  return useQuery({
    queryKey: ["profile", userId, "overview"],
    queryFn: ({ signal }) => fetchJson<ProfileOverview>(endpoints.INTERNAL.PROFILE_OVERVIEW, { signal }),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

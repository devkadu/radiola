import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { findProfileUser } from "./find-profile-user";

// React cache deduplicates metadata/page reads within one request, preserving fresh privacy checks.
export const getPublicProfileUser = cache(async (username: string) => {
  const user = await findProfileUser(username);
  if (!user) notFound();
  return user;
});

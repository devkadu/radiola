"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { followsService } from "@/services/follows";

interface Props {
  followingId: string;
  initialFollowing: boolean;
  currentUserId: string | null;
}

export function FollowButton({ followingId, initialFollowing, currentUserId }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!currentUserId) { router.push("/login"); return; }
    setLoading(true);
    try {
      if (following) {
        await followsService.unfollow(currentUserId, followingId);
      } else {
        await followsService.follow(currentUserId, followingId);
      }
      setFollowing(!following);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
        following
          ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]"
          : "bg-[var(--yellow)] text-black hover:bg-[var(--yellow-dim)]"
      }`}
    >
      {following ? "Seguindo ✓" : "Seguir"}
    </button>
  );
}

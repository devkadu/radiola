"use client";

import { useState } from "react";
import { EpisodeComments } from "@/components/EpisodeComments/EpisodeComments";
import { CommentDrawer } from "./_components";

interface Props {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  placeholder: string;
  episodeTitle?: string;
  episodeUrl?: string;
}

export function EpisodeCommentsSection({ seriesId, seasonNumber, episodeNumber, placeholder, episodeTitle, episodeUrl }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <EpisodeComments
        seriesId={seriesId}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        episodeTitle={episodeTitle}
        episodeUrl={episodeUrl}
        refreshKey={refreshKey}
      />
      <CommentDrawer
        seriesId={seriesId}
        seasonNumber={seasonNumber}
        episodeNumber={episodeNumber}
        placeholder={placeholder}
        onCommentAdded={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}

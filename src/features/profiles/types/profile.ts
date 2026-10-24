export interface ProfilePreferences {
  notify_replies: boolean;
  notify_weekly: boolean;
  notify_premiere: boolean;
  profile_public: boolean;
}

export interface ProfileIdentity {
  id: string;
  username: string;
  createdAt: string;
  avatarUrl: string | null;
  preferences: ProfilePreferences;
}

export interface ProfileComment {
  id: string;
  text: string;
  likes: number | null;
  episode_id: string;
  created_at: string;
}

export interface ProfileOverview {
  favorites: { series_id: number; series_name: string; series_slug: string; poster_path: string | null }[];
  commentCount: number;
  totalLikes: number;
  reactionCounts: Record<string, number>;
  topComment: ProfileComment | null;
  recentComments: ProfileComment[];
  seriesNames: Record<number, string>;
  watchedEpisodesCount: number;
}

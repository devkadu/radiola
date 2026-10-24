const segment = (value: string | number) => encodeURIComponent(String(value));

export const endpoints = {
  TMDB: {
    DISCOVER_SERIES: "/discover/tv",
    SEARCH_SERIES: "/search/tv",
    GET_GENRES: "/genre/tv/list",
    GET_ON_THE_AIR: "/tv/on_the_air",
    GET_WATCH_PROVIDERS: "/watch/providers/tv",
    GET_SERIES_DETAILS: (id: string | number) => `/tv/${segment(id)}`,
    GET_SEASON_DETAILS: (id: string | number, season: number) =>
      `/tv/${segment(id)}/season/${segment(season)}`,
    GET_EPISODE_DETAILS: (id: string | number, season: number, episode: number) =>
      `/tv/${segment(id)}/season/${segment(season)}/episode/${segment(episode)}`,
    GET_SERIES_PROVIDERS: (id: string | number) => `/tv/${segment(id)}/watch/providers`,
    GET_EPISODE_VIDEOS: (id: string | number, season: number, episode: number) =>
      `/tv/${segment(id)}/season/${segment(season)}/episode/${segment(episode)}/videos`,
    GET_SERIES_CREDITS: (id: string | number) => `/tv/${segment(id)}/credits`,
    GET_PERSON_DETAILS: (id: string | number) => `/person/${segment(id)}`,
    GET_PERSON_TV_CREDITS: (id: string | number) => `/person/${segment(id)}/tv_credits`,
    GET_TRENDING: (window: "day" | "week") => `/trending/tv/${window}`,
  },
  INTERNAL: {
    GET_SEASON: "/api/catalog/season",
    DISCOVER_SERIES: "/api/discover",
    SEARCH_SERIES: "/api/search",
    SMART_SEARCH: "/api/smart-search",
    PROFILE_OVERVIEW: "/api/profile/overview",
    PROFILE_SETTINGS: "/api/profile/settings",
    PROFILE_WATCHED: "/api/profile/watched",
    PROFILE_SERIES_PROGRESS: "/api/profile/series-progress",
    PROFILE_NEXT_EPISODES: "/api/profile/next-episodes",
    FAVORITES: "/api/profile/favorites",
    CACHE_EPISODES: "/api/cache-episodes",
    LISTS: "/api/lists",
    LIST_DETAILS: (id: string) => `/api/lists/${segment(id)}`,
    LIST_SERIES: (id: string) => `/api/lists/${segment(id)}/series`,
    LIST_SERIES_ITEM: (id: string, seriesId: number) =>
      `/api/lists/${segment(id)}/series/${segment(seriesId)}`,
    NOTIFY_REPLY: "/api/notify",
    FEEDBACK: "/api/feedback",
    ADMIN_ARTICLES: "/api/admin/articles",
    ADMIN_MODERATION: "/api/admin/moderation",
    HOT_EPISODES: "/api/hot-episodes",
    POPULAR_SERIES: "/api/popular-series",
    TOP_COMMENTERS: "/api/top-commenters",
    TRENDING_SEASONS: "/api/trending-seasons",
    MY_SERIES_EPISODES: "/api/my-series-episodes",
  },
} as const;

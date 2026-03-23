const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

export const tmdbService = {
  async getLatestSeries(page = 1) {
    // Pegamos a data de hoje para evitar séries que ainda vão estrear no futuro
    const today = new Date().toISOString().split("T")[0];

    const params = new URLSearchParams({
      language: "pt-BR",
      page: page.toString(),
      sort_by: "first_air_date.desc", // Ordem decrescente de lançamento
      "first_air_date.lte": today, // Menor ou igual a hoje
      "vote_count.gte": "10", // Filtro opcional: apenas séries com algum voto (evita lixo)
      include_null_first_air_dates: "false",
    });

    const res = await fetch(`${BASE_URL}/discover/tv?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
      },
      next: { revalidate: 3600 }, // Cache de 1 hora
    });

    if (!res.ok) throw new Error("Erro ao buscar lançamentos");

    return res.json();
  },

  async getPopularSeries(page = 1, genreId?: number | null) {
    const params = new URLSearchParams({
      language: "pt-BR",
      page: page.toString(),
      sort_by: "popularity.desc",
    });
    if (genreId) params.set("with_genres", genreId.toString());

    const res = await fetch(`${BASE_URL}/discover/tv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Erro ao buscar séries populares");
    return res.json();
  },

  async getSeasonDetails(seriesId: string, seasonNumber: number) {
    const res = await fetch(
      `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar temporada");
    return res.json();
  },

  async getEpisodeDetails(seriesId: string, seasonNumber: number, episodeNumber: number) {
    const res = await fetch(
      `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar episódio");
    return res.json();
  },

  async getWatchProvidersList() {
    const res = await fetch(
      `${BASE_URL}/watch/providers/tv?language=pt-BR&watch_region=BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return { results: [] };
    return res.json();
  },

  async getGenres() {
    const res = await fetch(
      `${BASE_URL}/genre/tv/list?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return { genres: [] };
    return res.json();
  },

  async discoverSeries({
    page = 1,
    sortBy = "popularity.desc",
    genreId,
    providerId,
  }: {
    page?: number;
    sortBy?: string;
    genreId?: number | null;
    providerId?: number | null;
  } = {}) {
    const params = new URLSearchParams({
      language: "pt-BR",
      page: page.toString(),
      sort_by: sortBy,
      watch_region: "BR",
      "vote_count.gte": "20",
      include_null_first_air_dates: "false",
    });
    if (genreId) params.set("with_genres", genreId.toString());
    if (providerId) {
      params.set("with_watch_providers", providerId.toString());
    }
    const res = await fetch(`${BASE_URL}/discover/tv?${params}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error("Erro ao descobrir séries");
    return res.json();
  },

  async getWatchProviders(seriesId: string) {
    const res = await fetch(
      `${BASE_URL}/tv/${seriesId}/watch/providers`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return { results: {} };
    return res.json();
  },

  async getEpisodeVideos(seriesId: string, seasonNumber: number, episodeNumber: number) {
    const res = await fetch(
      `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}/videos?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return { results: [] };
    return res.json();
  },

  async searchSeries(query: string, page = 1) {
    const params = new URLSearchParams({
      language: "pt-BR",
      query,
      page: page.toString(),
    });

    const res = await fetch(`${BASE_URL}/search/tv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Erro ao buscar séries");
    return res.json();
  },

  async getSeriesDetails(id: string) {
    const res = await fetch(
      `${BASE_URL}/tv/${id}?language=pt-BR&append_to_response=videos`,
      {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
        },
        next: { revalidate: 3600 }, // Cache de 1 hora
      }
    );

    if (!res.ok) throw new Error("Erro ao buscar detalhes da série");

    return res.json();
  },

  async getSeriesCredits(id: string) {
    const res = await fetch(
      `${BASE_URL}/tv/${id}/credits?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return { cast: [] };
    return res.json();
  },

  async getPersonDetails(id: string) {
    const res = await fetch(
      `${BASE_URL}/person/${id}?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar pessoa");
    return res.json();
  },

  async getPersonTvCredits(id: string) {
    const res = await fetch(
      `${BASE_URL}/person/${id}/tv_credits?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return { cast: [] };
    return res.json();
  },

  async getTrendingNow(timeWindow: "day" | "week" = "day") {
    const res = await fetch(
      `${BASE_URL}/trending/tv/${timeWindow}?language=pt-BR`,
      {
        headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
        next: { revalidate: timeWindow === "day" ? 3600 : 86400 },
      }
    );
    if (!res.ok) throw new Error("Erro ao buscar trending");
    return res.json();
  },

  async getUpcomingSeries() {
    const today = new Date().toISOString().split("T")[0];
    const oneYearAhead = new Date();
    oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
    const maxDate = oneYearAhead.toISOString().split("T")[0];

    const params = new URLSearchParams({
      language: "pt-BR",
      sort_by: "popularity.desc",
      "first_air_date.gte": today,
      "first_air_date.lte": maxDate,
      include_null_first_air_dates: "false",
    });

    const res = await fetch(`${BASE_URL}/discover/tv?${params}`, {
      headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
      next: { revalidate: 43200 }, // 12 horas
    });
    if (!res.ok) throw new Error("Erro ao buscar próximas estreias");
    return res.json();
  },
};

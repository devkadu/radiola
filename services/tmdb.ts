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
};

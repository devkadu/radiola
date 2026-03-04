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

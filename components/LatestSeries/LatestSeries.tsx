import { tmdbService } from "@/services/tmdb";

export const LatestSeries = async () => {
  const data = await tmdbService.getLatestSeries();
  const series = data.results.slice(0, 10); // Pega as 10 primeiras séries
  console.log(series);

  return (
    <section>
      <h2 className="font-bold text-xl mb-4">Últimas Séries</h2>
      <ul className="flex gap-4 overflow-x-auto">
        {series.map((serie: any) => (
          <li key={serie.id} className="w-40 h-60 shrink-0 rounded">
            {serie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w200${serie.poster_path}`}
                alt={serie.name}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
};

import { Suspense } from "react";
import { GenreTags } from "@/components/GenreTags";
import { PopularSeries } from "@/components/PopularSeries";
import { HotEpisodes } from "@/components/HotEpisodes/HotEpisodes";
import { TrendingSeasons } from "@/components/TrendingSeasons/TrendingSeasons";
import { TopCommenters } from "@/components/TopCommenters/TopCommenters";

interface Props {
  searchParams: Promise<{ genre?: string }>;
}

const Home = async ({ searchParams }: Props) => {
  const { genre } = await searchParams;
  const genreId = genre ? Number(genre) : null;

  return (
    <main>
      <HotEpisodes />

      <section className="px-4 lg:px-0 pb-2">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Séries populares</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">As comunidades mais ativas da semana</p>
        </div>
        <Suspense>
          <GenreTags />
        </Suspense>
        <PopularSeries genreId={genreId} />
      </section>

      <TrendingSeasons />
      <TopCommenters />
    </main>
  );
};
export default Home;

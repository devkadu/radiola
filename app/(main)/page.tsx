import { PopularSeries } from "@/components/PopularSeries";
import { HotEpisodes } from "@/components/HotEpisodes/HotEpisodes";
import { TrendingSeasons } from "@/components/TrendingSeasons/TrendingSeasons";
import { TopCommenters } from "@/components/TopCommenters/TopCommenters";

const Home = () => {
  return (
    <main>
      <HotEpisodes />

      <section className="px-4 lg:px-0 pb-2">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Séries populares</h2>
        </div>
        <PopularSeries />
      </section>

      <TrendingSeasons />
      <TopCommenters />
    </main>
  );
};
export default Home;

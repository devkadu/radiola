import { PopularSeries } from "@/components/PopularSeries";
import { HotEpisodes } from "@/components/HotEpisodes/HotEpisodes";
import { TrendingSeasons } from "@/components/TrendingSeasons/TrendingSeasons";
import { TopCommenters } from "@/components/TopCommenters/TopCommenters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Segunda Temporada — Debate séries sem spoilers",
  description:
    "Descubra episódios em debate e séries populares. Comente sem spoilers no seu ritmo.",
};

const Home = () => {
  return (
    <main className="lg:px-8">
      <h1 className="sr-only">Segunda Temporada — Debate séries sem spoilers</h1>
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

import { PopularSeries } from "@/features/catalog/components/popular-series/index";
import { Hero } from "@/features/home/components/hero/index";
import { TrendingSeasons } from "@/features/community/components/trending-seasons/trending-seasons";
import { TopCommenters } from "@/features/community/components/top-commenters/top-commenters";
import { WeekCalendar } from "@/features/catalog/components/week-calendar/week-calendar";
import {
  HomeGuestContent,
  HomeIntro,
} from "@/features/home/components/home-audience/home-audience.client";
import { HotEpisodes } from "@/features/community/components/hot-episodes/hot-episodes";
import { HowItWorks } from "@/features/home/components/how-it-works/how-it-works";
import { Suspense } from "react";

export const HomeView = () => {
  return (
    <main className="lg:px-8">
      <HomeIntro>
        <Suspense fallback={null}>
          <Hero />
        </Suspense>
      </HomeIntro>

      <HotEpisodes />

      <HomeGuestContent>
        <HowItWorks />
      </HomeGuestContent>

      <Suspense fallback={null}>
        <WeekCalendar />
      </Suspense>

      <section className="px-4 lg:px-0 pt-2 pb-2">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-(--text-primary)">Séries populares</h2>
        </div>
        <PopularSeries />
      </section>

      <TrendingSeasons />
      <TopCommenters />
    </main>
  );
};

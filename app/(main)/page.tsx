import { PopularSeries } from "@/components/PopularSeries";
import { Hero } from "@/components/Hero";
import { TrendingSeasons } from "@/components/TrendingSeasons/TrendingSeasons";
import { TopCommenters } from "@/components/TopCommenters/TopCommenters";
import { WeekCalendar } from "@/components/WeekCalendar/WeekCalendar";
import { PersonalizedHome } from "@/components/PersonalizedHome/PersonalizedHome";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Segunda Temporada — Debate séries episódio a episódio",
  description:
    "Descubra episódios em debate e séries populares. Comente no seu ritmo, episódio por episódio.",
};

const Home = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username || user?.user_metadata?.name || user?.email?.split("@")[0] || "";

  return (
    <main className="lg:px-8">
      {user ? (
        <PersonalizedHome username={username} />
      ) : (
        <Suspense fallback={null}>
          <Hero />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <WeekCalendar />
      </Suspense>

      <section className="px-4 lg:px-0 pt-2 pb-2">
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

import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SearchBar } from "@/components/SearchBar";
import { GenreTags } from "@/components/GenreTags";
import { PopularSeries } from "@/components/PopularSeries";
import { NowDebating } from "@/components/NowDebating";

interface Props {
  searchParams: Promise<{ genre?: string }>;
}

const Home = async ({ searchParams }: Props) => {
  const { genre } = await searchParams;
  const genreId = genre ? Number(genre) : null;

  return (
    <main>
      <Header />
      <Hero />
      <SearchBar />
      <Suspense>
        <GenreTags />
      </Suspense>
      <PopularSeries genreId={genreId} />
      <NowDebating />
    </main>
  );
};
export default Home;

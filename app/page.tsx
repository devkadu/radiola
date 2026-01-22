import { BottonNavigator } from "@/components/BottonNavigator";
import { Header } from "@/components/Header";
import { LatestSeries } from "@/components/LatestSeries/LatestSeries";
import { tmdbService } from "@/services/tmdb";

const Home = async () => {
  return (
    <main>
      <Header />
      <LatestSeries />

      <BottonNavigator />
    </main>
  );
};
export default Home;

import { BottonNavigator } from "@/app/_components/botton-navigator/index";
import { Header } from "@/app/_components/header/index";
import { Sidebar } from "@/app/_components/sidebar/index";
import { SearchOverlay } from "@/features/search/components/search-overlay/search-overlay";
import { SearchProvider } from "@/features/search/components/search-provider/search-provider.client";
import { TmdbAttribution } from "@/shared/components/tmdb-attribution/tmdb-attribution";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="lg:flex min-h-screen lg:h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
          <Header />
          <div className="flex-1 min-h-0 max-w-[1296px] w-full mx-auto lg:overflow-y-auto">
            {children}
          </div>
          <TmdbAttribution />
          <BottonNavigator />
        </div>
      </div>
      <SearchOverlay />
    </SearchProvider>
  );
}

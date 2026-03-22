import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { BottonNavigator } from "@/components/BottonNavigator";
import { SearchOverlay } from "@/components/SearchOverlay/SearchOverlay";
import { SearchProvider } from "@/context/SearchContext";
import { TmdbAttribution } from "@/components/TmdbAttribution/TmdbAttribution";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="lg:flex min-h-screen">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <div className="flex-1 max-w-[1296px] w-full mx-auto">
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

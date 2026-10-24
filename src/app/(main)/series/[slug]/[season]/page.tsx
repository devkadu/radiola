export { SeasonDetailsView as default } from "@/features/catalog/views/season-details-view/season-details-view";

export const revalidate = 3600;

export { generateMetadata } from "@/features/catalog/server/metadata/season-details-view.metadata";

export function generateStaticParams() {
  return [];
}

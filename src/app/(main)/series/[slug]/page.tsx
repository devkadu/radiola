export { SeriesDetailsView as default } from "@/features/catalog/views/series-details-view/series-details-view";

export const revalidate = 3600;

export { generateMetadata,generateStaticParams } from "@/features/catalog/server/metadata/series-details-view.metadata";

export { BestSeriesView as default } from "@/features/catalog/views/best-series-view/best-series-view";

export const revalidate = 86400;

export { generateMetadata,generateStaticParams } from "@/features/catalog/server/metadata/best-series-view.metadata";

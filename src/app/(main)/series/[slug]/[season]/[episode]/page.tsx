export { EpisodeDetailsView as default } from "@/features/catalog/views/episode-details-view/episode-details-view";

export const revalidate = 1800;

export { generateMetadata,generateStaticParams } from "@/features/catalog/server/metadata/episode-details-view.metadata";

export { PublicProfileView as default } from "@/features/profiles/views/public-profile-view/public-profile-view";

export const dynamic = "force-dynamic";

export const revalidate = 3600;

export { generateMetadata } from "@/features/profiles/server/metadata/public-profile-view.metadata";

export { PersonView as default } from "@/features/catalog/views/person-view/person-view";

export const revalidate = 86400;

export { generateMetadata } from "@/features/catalog/server/metadata/person-view.metadata";

// Generate public people pages on first access and reuse them with ISR.
export function generateStaticParams() {
  return [];
}

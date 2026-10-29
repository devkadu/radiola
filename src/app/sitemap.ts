import { getSitemapEntries } from "@/features/site/server/queries/get-sitemap-entries";

export const revalidate = 3600;

export default getSitemapEntries;

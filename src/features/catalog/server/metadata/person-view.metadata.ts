import { SITE_URL as siteUrl } from "@/shared/constants/site";

import { getPersonDetails } from "@/server/integrations/tmdb/requests/get-person-details";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const person = await getPersonDetails(id).catch(() => null);
  if (!person) return {};
  return {
    title: person.name,
    description: person.biography?.slice(0, 160),
    alternates: { canonical: `${siteUrl}/pessoa/${id}` },
  };
}

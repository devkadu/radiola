

import { getPersonDetails } from "@/server/integrations/tmdb/requests/get-person-details";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://segundatemporada.com.br";

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

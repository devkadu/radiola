import { SITE_URL as siteUrl } from "@/shared/constants/site";
import { supabaseAdmin as supabase } from "@/server/database/admin";

import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase.from("articles").select("title, seo_title, seo_description").eq("slug", slug).eq("status", "published").single();
  if (!data) return {};
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || undefined,
    alternates: { canonical: `${siteUrl}/artigos/${slug}` },
  };
}

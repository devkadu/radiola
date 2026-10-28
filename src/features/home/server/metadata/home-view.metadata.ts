import type { Metadata } from "next";
import { socialPreviewMetadata } from "@/shared/constants/social-preview";

export const metadata: Metadata = {
  ...socialPreviewMetadata,
  title: { absolute: socialPreviewMetadata.openGraph.title },
  description: socialPreviewMetadata.openGraph.description,
  alternates: { canonical: "/" },
  openGraph: { ...socialPreviewMetadata.openGraph, url: "/" },
};

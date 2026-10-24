import { z } from "zod";
export const articleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(500).optional().default(""),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  body: z.string().trim().min(1).max(50000),
  status: z.enum(["draft", "published", "archived"]),
  seo_title: z.string().max(200).optional().default(""),
  seo_description: z.string().max(500).optional().default(""),
}).strict();

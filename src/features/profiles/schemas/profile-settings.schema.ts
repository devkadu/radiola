import { z } from "zod";

export const profileSettingsSchema = z.object({
  notify_replies: z.boolean().optional(), notify_weekly: z.boolean().optional(),
  notify_premiere: z.boolean().optional(), profile_public: z.boolean().optional(),
}).strict().refine((updates) => Object.keys(updates).length > 0);

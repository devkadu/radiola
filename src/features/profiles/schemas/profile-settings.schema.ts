import { z } from "zod";

export const profileUsernameSchema = z.string().trim()
  .min(3, "Use de 3 a 30 caracteres.")
  .max(30, "Use de 3 a 30 caracteres.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras sem acento, números, hífens ou sublinhados.");

export const profileSettingsSchema = z.object({
  username: profileUsernameSchema.optional(),
  notify_replies: z.boolean().optional(), notify_weekly: z.boolean().optional(),
  notify_premiere: z.boolean().optional(), profile_public: z.boolean().optional(),
}).strict().refine((updates) => Object.keys(updates).length > 0);

export type ProfileSettingsUpdates = z.infer<typeof profileSettingsSchema>;

import { z } from "zod";

export const MAX_COMMENT_LENGTH = 2000;
export const commentInputSchema = z.object({
  episode_id: z.string().trim().min(1).max(200),
  user_id: z.uuid(),
  text: z.string().trim().min(1).max(MAX_COMMENT_LENGTH),
  parent_id: z.uuid().nullable(),
});

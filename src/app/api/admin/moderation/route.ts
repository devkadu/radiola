import * as handler from "@/features/moderation/server/handlers/moderation.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "moderation.moderation");

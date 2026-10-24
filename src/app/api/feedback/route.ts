import * as handler from "@/features/feedback/server/handlers/feedback.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "feedback.feedback");

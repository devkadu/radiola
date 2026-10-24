import * as handler from "@/features/notifications/server/handlers/notify.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "notifications.notify");

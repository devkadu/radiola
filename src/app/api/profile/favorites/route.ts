import * as handler from "@/features/progress/server/handlers/favorites.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "progress.favorites");
export const DELETE = withApiHandler(handler.DELETE, "progress.favorites");

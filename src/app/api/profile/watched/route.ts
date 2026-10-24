import * as handler from "@/features/progress/server/handlers/watched-history.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "progress.watched-history");

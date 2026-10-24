import * as handler from "@/features/progress/server/handlers/series-progress.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "progress.series-progress");

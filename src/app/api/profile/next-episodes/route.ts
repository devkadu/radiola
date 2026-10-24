import * as handler from "@/features/progress/server/handlers/next-episodes.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "progress.next-episodes");

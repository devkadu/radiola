import * as handler from "@/features/community/server/handlers/my-series-episodes.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "community.my-series-episodes");

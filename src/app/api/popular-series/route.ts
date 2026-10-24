import * as handler from "@/features/community/server/handlers/popular-series.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "community.popular-series");

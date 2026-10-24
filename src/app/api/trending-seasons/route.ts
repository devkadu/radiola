import * as handler from "@/features/community/server/handlers/trending-seasons.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "community.trending-seasons");

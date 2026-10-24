import * as handler from "@/features/community/server/handlers/top-commenters.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "community.top-commenters");

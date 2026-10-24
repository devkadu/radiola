import * as handler from "@/features/search/server/handlers/search.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "search.search");

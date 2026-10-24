import * as handler from "@/features/catalog/server/handlers/discover.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "catalog.discover");

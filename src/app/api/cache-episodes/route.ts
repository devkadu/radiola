import * as handler from "@/features/catalog/server/handlers/cache-episodes.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "catalog.cache-episodes");

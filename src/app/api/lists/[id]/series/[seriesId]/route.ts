import * as handler from "@/features/lists/server/handlers/list-series-item.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const DELETE = withApiHandler(handler.DELETE, "lists.list-series-item");

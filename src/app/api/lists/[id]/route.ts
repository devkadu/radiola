import * as handler from "@/features/lists/server/handlers/list-details.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "lists.list-details");
export const DELETE = withApiHandler(handler.DELETE, "lists.list-details");

import * as handler from "@/features/lists/server/handlers/lists.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "lists.lists");
export const POST = withApiHandler(handler.POST, "lists.lists");

import * as handler from "@/features/lists/server/handlers/list-series.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "lists.list-series");

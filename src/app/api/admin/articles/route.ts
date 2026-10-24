import * as handler from "@/features/editorial/server/handlers/articles.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(handler.POST, "editorial.articles");
export const PUT = withApiHandler(handler.PUT, "editorial.articles");
export const DELETE = withApiHandler(handler.DELETE, "editorial.articles");

import * as handler from "@/features/profiles/server/handlers/overview.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(handler.GET, "profiles.overview");

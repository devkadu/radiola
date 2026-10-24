import * as handler from "@/features/profiles/server/handlers/settings.handler";
import { withApiHandler } from "@/server/http/with-api-handler";

export const PATCH = withApiHandler(handler.PATCH, "profiles.settings");

import { getProfileOverview } from "@/features/profiles/server/queries/get-profile-overview";
import { apiError } from "@/server/http/api-error";
import { NextResponse } from "next/server";
import "server-only";

export async function GET() {
  try {
    return NextResponse.json(await getProfileOverview(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return apiError(error, "profile.overview");
  }
}

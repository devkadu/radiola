import { getSmartAnswer } from "@/features/search/server/queries/get-smart-answer";
import { searchQuerySchema } from "@/features/search/schemas/search-query.schema";
import { NextRequest,NextResponse } from "next/server";
import "server-only";

export const GET = async (req: NextRequest) => {
  const q = searchQuerySchema.parse(req.nextUrl.searchParams.get("q") ?? "");
  const smartAnswer = await getSmartAnswer(q);
  return NextResponse.json(
    { smartAnswer },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
};

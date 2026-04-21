import { NextRequest, NextResponse } from "next/server";
import { getSmartAnswer } from "@/lib/smartSearch";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const smartAnswer = await getSmartAnswer(q);
  return NextResponse.json(
    { smartAnswer },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}

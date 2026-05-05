import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { analyzeMeetingText } from "@/lib/meeting-analysis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const result = await analyzeMeetingText({
      text,
      workspaceId: user.workspaceId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("ANALYZE ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

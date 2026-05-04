import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import {
  generateDailyOperationsForDate,
  parseDailyOperationDate,
} from "@/lib/daily-operations";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const body = await req.json().catch(() => ({}));
    const date = parseDailyOperationDate(
      typeof body?.date === "string" ? body.date : null,
    );

    const result = await generateDailyOperationsForDate({
      date,
      workspaceId: user.workspaceId ?? null,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (error) {
    console.error("DAILY OPERATIONS RUN ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to run daily operations",
        logs: [error instanceof Error ? error.message : String(error)],
      },
      { status: 500 },
    );
  }
}

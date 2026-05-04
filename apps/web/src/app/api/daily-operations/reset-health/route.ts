import { NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { resetProjectHealthBaselines } from "@/lib/daily-operations";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireCanRead();
    const result = await resetProjectHealthBaselines(user.workspaceId ?? null);

    return NextResponse.json(result);
  } catch (error) {
    console.error("RESET PROJECT HEALTH BASELINES ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to reset project health baselines",
        logs: [error instanceof Error ? error.message : String(error)],
      },
      { status: 500 },
    );
  }
}

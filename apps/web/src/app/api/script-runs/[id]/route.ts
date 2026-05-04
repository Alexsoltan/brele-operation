import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { getScriptRunForWorkspace } from "@/lib/script-runs";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireCanRead();
    const run = await getScriptRunForWorkspace(params.id, user.workspaceId ?? null);

    if (!run) {
      return NextResponse.json(
        {
          ok: false,
          error: "Script run not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      run,
    });
  } catch (error) {
    console.error("SCRIPT RUN GET ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to get script run",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { createScriptRun, SCRIPT_RUN_KINDS } from "@/lib/script-runs";
import { runScriptInBackground } from "@/lib/script-runner";

export const runtime = "nodejs";

const TITLE_BY_KIND: Record<string, string> = {
  [SCRIPT_RUN_KINDS.dailyOperations]: "Daily operations",
  [SCRIPT_RUN_KINDS.signalsRebuild]: "Signals rebuild",
  [SCRIPT_RUN_KINDS.resetHealth]: "Reset project metrics",
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const body = await req.json().catch(() => ({}));
    const kind = typeof body?.kind === "string" ? body.kind : "";

    if (!Object.values(SCRIPT_RUN_KINDS).includes(kind as never)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unknown script kind",
        },
        { status: 400 },
      );
    }

    const input =
      body && typeof body.input === "object" && body.input !== null
        ? (body.input as Record<string, unknown>)
        : {};

    const run = await createScriptRun({
      workspaceId: user.workspaceId ?? null,
      userId: user.id,
      kind: kind as (typeof SCRIPT_RUN_KINDS)[keyof typeof SCRIPT_RUN_KINDS],
      title: TITLE_BY_KIND[kind] ?? kind,
      input,
    });

    runScriptInBackground({
      id: run.id,
      kind: run.kind,
      workspaceId: run.workspaceId,
      input: run.input as Record<string, unknown> | null,
    });

    return NextResponse.json(
      {
        ok: true,
        run,
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("SCRIPT RUN START ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to start script run",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireCanRead } from "@/lib/auth";
import { rebuildAutomaticSignals } from "@/lib/rebuild-automatic-signals";

export const runtime = "nodejs";

export async function POST() {
  const logs: string[] = [];

  try {
    const user = await requireCanRead();
    const workspaceId = user.workspaceId ?? null;

    const result = await rebuildAutomaticSignals({
      workspaceId,
      onLog: (line) => {
        logs.push(line);
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI ANALYSIS RECALCULATE ERROR:", error);

    logs.push(`❌ Ошибка: ${String(error)}`);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to recalculate",
        logs,
      },
      { status: 500 },
    );
  }
}

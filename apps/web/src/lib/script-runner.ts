import {
  appendScriptRunLogs,
  completeScriptRun,
  failScriptRun,
  markScriptRunRunning,
  SCRIPT_RUN_KINDS,
} from "@/lib/script-runs";
import {
  generateDailyOperationsForDate,
  parseDailyOperationDate,
  resetProjectHealthBaselines,
} from "@/lib/daily-operations";
import { rebuildAutomaticSignals } from "@/lib/rebuild-automatic-signals";

type RunScriptInput = {
  id: string;
  kind: string;
  workspaceId: string | null;
  input?: Record<string, unknown> | null;
};

const activeRuns = new Set<string>();

export function runScriptInBackground(payload: RunScriptInput) {
  if (activeRuns.has(payload.id)) return;

  activeRuns.add(payload.id);

  setTimeout(() => {
    void executeScript(payload).finally(() => {
      activeRuns.delete(payload.id);
    });
  }, 0);
}

async function executeScript({ id, kind, workspaceId, input }: RunScriptInput) {
  try {
    await markScriptRunRunning(id);

    if (kind === SCRIPT_RUN_KINDS.dailyOperations) {
      const date = parseDailyOperationDate(
        typeof input?.date === "string" ? input.date : null,
      );
      const result = await generateDailyOperationsForDate({
        date,
        workspaceId,
      });

      await appendScriptRunLogs(id, result.logs);
      await completeScriptRun(id, {
        ok: result.ok,
        date: result.date,
        chatSummaries: result.chatSummaries,
        projectSignals: result.projectSignals,
      });
      return;
    }

    if (kind === SCRIPT_RUN_KINDS.signalsRebuild) {
      const result = await rebuildAutomaticSignals({
        workspaceId,
        onLog: (line) => appendScriptRunLogs(id, [line]),
      });

      await completeScriptRun(id, result);
      return;
    }

    if (kind === SCRIPT_RUN_KINDS.resetHealth) {
      const result = await resetProjectHealthBaselines(workspaceId);

      await appendScriptRunLogs(id, result.logs);
      await completeScriptRun(id, result);
      return;
    }

    throw new Error(`Unknown script kind: ${kind}`);
  } catch (error) {
    await failScriptRun(id, error);
  }
}

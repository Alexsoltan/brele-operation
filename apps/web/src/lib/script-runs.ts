import { prisma } from "@/lib/prisma";

export const SCRIPT_RUN_STATUSES = {
  queued: "queued",
  running: "running",
  success: "success",
  failed: "failed",
} as const;

export const SCRIPT_RUN_KINDS = {
  dailyOperations: "daily_operations",
  signalsRebuild: "signals_rebuild",
  resetHealth: "reset_health",
} as const;

type ScriptRunKind =
  (typeof SCRIPT_RUN_KINDS)[keyof typeof SCRIPT_RUN_KINDS];

type CreateScriptRunInput = {
  workspaceId: string | null;
  userId: string;
  kind: ScriptRunKind;
  title: string;
  input?: Record<string, unknown>;
};

export async function createScriptRun({
  workspaceId,
  userId,
  kind,
  title,
  input,
}: CreateScriptRunInput) {
  return prisma.scriptRun.create({
    data: {
      workspaceId,
      userId,
      kind,
      title,
      input,
      logs: ["Задача поставлена в очередь."],
    },
  });
}

export async function getScriptRunForWorkspace(
  id: string,
  workspaceId: string | null,
) {
  return prisma.scriptRun.findFirst({
    where: {
      id,
      workspaceId,
    },
  });
}

export async function markScriptRunRunning(id: string) {
  return prisma.scriptRun.update({
    where: { id },
    data: {
      status: SCRIPT_RUN_STATUSES.running,
      startedAt: new Date(),
      logs: {
        push: "Задача запущена на сервере.",
      },
    },
  });
}

export async function appendScriptRunLogs(id: string, lines: string[]) {
  if (lines.length === 0) return;

  await prisma.scriptRun.update({
    where: { id },
    data: {
      logs: {
        push: lines,
      },
    },
  });
}

export async function completeScriptRun(
  id: string,
  result: Record<string, unknown>,
) {
  return prisma.scriptRun.update({
    where: { id },
    data: {
      status: SCRIPT_RUN_STATUSES.success,
      result,
      finishedAt: new Date(),
      logs: {
        push: "Задача завершена.",
      },
    },
  });
}

export async function failScriptRun(id: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return prisma.scriptRun.update({
    where: { id },
    data: {
      status: SCRIPT_RUN_STATUSES.failed,
      error: message,
      finishedAt: new Date(),
      logs: {
        push: `Ошибка: ${message}`,
      },
    },
  });
}

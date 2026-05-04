import { prisma } from "@/lib/prisma";
import type {
  CreateProjectSignalInput,
  ProjectSignal,
  SignalDirection,
  SignalSeverity,
} from "@/lib/types";
import type { ProjectSignal as PrismaProjectSignal } from "@/generated/prisma/client";

/**
 * Нормализация сигнала перед записью
 */
function normalizeSignalInput(input: CreateProjectSignalInput) {
  return {
    ...input,
    status: input.status ?? "active",
    confidence: input.confidence ?? null,
    occurredAt: new Date(input.occurredAt),
  };
}

/**
 * Простая дедупликация сигналов
 * (защита от дублей от AI/повторного анализа)
 */
async function isDuplicateSignal(input: CreateProjectSignalInput) {
  const existing = await prisma.projectSignal.findFirst({
    where: {
      projectId: input.projectId,
      type: input.type,
      text: input.text,
      occurredAt: new Date(input.occurredAt),
    },
  });

  return Boolean(existing);
}
export async function createProjectSignal(
  input: CreateProjectSignalInput,
): Promise<ProjectSignal | null> {
  const normalized = normalizeSignalInput(input);

  const duplicate = await isDuplicateSignal(input);

  if (duplicate) {
    return null;
  }

  const signal = await prisma.projectSignal.create({
    data: normalized,
  });

  return {
    ...signal,
    occurredAt: signal.occurredAt.toISOString(),
    createdAt: signal.createdAt.toISOString(),
    updatedAt: signal.updatedAt.toISOString(),
  };
}
export async function getProjectSignals(projectId: string) {
  const signals = await prisma.projectSignal.findMany({
    where: {
      projectId,
      status: "active",
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 20,
  });

  return signals.map((s: PrismaProjectSignal) => ({
    ...s,
    occurredAt: s.occurredAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}
export function getSignalSeverityFromText(text: string): SignalSeverity {
  const t = text.toLowerCase();

  if (
    t.includes("срыв") ||
    t.includes("критично") ||
    t.includes("эскалация")
  ) {
    return "critical";
  }

  if (
    t.includes("риск") ||
    t.includes("проблем") ||
    t.includes("блокер")
  ) {
    return "high";
  }

  if (
    t.includes("вопрос") ||
    t.includes("сомнение")
  ) {
    return "medium";
  }

  return "low";
}
export function getSignalDirectionFromText(
  text: string,
): SignalDirection {
  const t = text.toLowerCase();

  if (
    t.includes("доволен") ||
    t.includes("хорошо") ||
    t.includes("отлично")
  ) {
    return "positive";
  }

  if (
    t.includes("недоволен") ||
    t.includes("плохо") ||
    t.includes("проблем")
  ) {
    return "negative";
  }

  return "neutral";
}
import { prisma } from "@/lib/prisma";
import { clampHealthScore } from "@/lib/project-health";
import { getSignalWeightConfig } from "@/lib/signal-weight-config";
import type {
  Mood,
  ProjectHealthLabel,
  ProjectHealthTrend,
  ProjectSignal,
  Risk,
  SignalWeightConfig,
} from "@/lib/types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreToMood(score: number): Mood {
  if (score >= 75) return "good";
  if (score <= 45) return "bad";
  return "neutral";
}

function scoreToRisk(score: number): Risk {
  if (score <= 55) return "high";
  if (score <= 75) return "medium";
  return "low";
}

function getHealthLabel(score: number): ProjectHealthLabel {
  if (score <= 69) return "critical";
  if (score <= 79) return "attention";
  return "stable";
}

function getHealthTrend(
  currentScore: number,
  previousScore: number,
): ProjectHealthTrend {
  if (currentScore > previousScore) return "up";
  if (currentScore < previousScore) return "down";
  return "flat";
}

function buildHealthSummary(signalCount: number, score: number) {
  if (signalCount === 0) {
    return "Пока недостаточно сигналов для оценки проекта.";
  }

  if (score <= 45) {
    return "Проект в зоне риска: есть критичные сигналы.";
  }

  if (score <= 69) {
    return "Есть заметные проблемы, требующие внимания.";
  }

  if (score <= 79) {
    return "Проект нестабилен, стоит следить за динамикой.";
  }

  return "Проект выглядит стабильно.";
}

export async function recalculateProjectHealth(
  projectId: string,
  workspaceId?: string | null,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      workspaceId: true,
      healthScore: true,
    },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const resolvedWorkspaceId = workspaceId ?? project.workspaceId ?? null;

  const rawSignals = await prisma.projectSignal.findMany({
    where: {
      projectId,
      status: "active",
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  const signals: ProjectSignal[] = rawSignals.map((signal: any) => ({
    ...signal,
    occurredAt: signal.occurredAt.toISOString(),
    createdAt: signal.createdAt.toISOString(),
    updatedAt: signal.updatedAt.toISOString(),
  }));

  const weights = (await getSignalWeightConfig(
    resolvedWorkspaceId,
  )) as SignalWeightConfig[];

  let healthScore = 100;
  let clientMoodScore = 60;
  let teamMoodScore = 60;

  const healthPoints = signals.map((signal) => {
    const config = weights.find((weight) => weight.type === signal.type);

    const healthImpact = Math.round(config?.weight ?? 0);
    const clientImpact = config?.clientMoodImpact ?? 0;
    const teamImpact = config?.teamMoodImpact ?? 0;

    const previousScore = healthScore;

    healthScore = clampHealthScore(healthScore + healthImpact);
    clientMoodScore = clampScore(clientMoodScore + clientImpact);
    teamMoodScore = clampScore(teamMoodScore + teamImpact);

    return {
      projectId: project.id,
      meetingId: null,
      date: new Date(signal.occurredAt),
      score: healthScore,
      delta: healthScore - previousScore,
      impact: healthImpact,
      risk: scoreToRisk(healthScore),
      clientMood: scoreToMood(clientMoodScore),
      teamMood: scoreToMood(teamMoodScore),
      hasClient: true,
    };
  });

  const healthTrend = getHealthTrend(healthScore, project.healthScore ?? 100);
  const healthLabel = getHealthLabel(healthScore);
  const healthSummary = buildHealthSummary(signals.length, healthScore);

  await prisma.$transaction([
    prisma.projectHealthPoint.deleteMany({
      where: { projectId: project.id },
    }),

    ...(healthPoints.length > 0
      ? [
          prisma.projectHealthPoint.createMany({
            data: healthPoints,
          }),
        ]
      : []),

    prisma.project.update({
      where: { id: project.id },
      data: {
        healthScore,
        healthTrend,
        healthLabel,
        healthSummary,
        clientMood: scoreToMood(clientMoodScore),
        teamMood: scoreToMood(teamMoodScore),
        risk: scoreToRisk(healthScore),
        healthCalculatedAt: new Date(),
      },
    }),
  ]);

  return prisma.project.findUnique({
    where: { id: project.id },
  });
}
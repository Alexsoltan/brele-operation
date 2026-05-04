import { analyzeProjectDay } from "@/lib/ai-analysis/analyze-project-day";
import { generateDailyChatSummariesForDate } from "@/lib/chat-summary-service";
import { prisma } from "@/lib/prisma";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";

type DailyOperationsOptions = {
  date: Date;
  workspaceId?: string | null;
  projectId?: string;
};

type DailySignalsResult = {
  date: string;
  totalProjects: number;
  processedProjects: number;
  failedProjects: number;
  createdSignals: number;
  logs: string[];
};

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function parseDailyOperationDate(value?: string | null) {
  if (!value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

export async function generateDailyProjectSignalsForDate({
  date,
  workspaceId,
  projectId,
}: DailyOperationsOptions): Promise<DailySignalsResult> {
  const { start, end } = getDayRange(date);
  const dateKey = start.toISOString().slice(0, 10);
  const logs: string[] = [`Date: ${dateKey}`];

  const projects = await prisma.project.findMany({
    where: {
      id: projectId,
      workspaceId: workspaceId === undefined ? undefined : workspaceId,
      deletedAt: null,
      OR: [
        {
          meetings: {
            some: {
              deletedAt: null,
              date: {
                gte: start,
                lt: end,
              },
            },
          },
        },
        {
          projectChats: {
            some: {
              messages: {
                some: {
                  date: {
                    gte: start,
                    lt: end,
                  },
                },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  logs.push(`Projects with day context: ${projects.length}`);

  let processedProjects = 0;
  let failedProjects = 0;
  let createdSignals = 0;

  for (const project of projects) {
    try {
      logs.push(`Analyzing ${project.name}`);

      const signals = await analyzeProjectDay(project.id, start);
      createdSignals += signals.length;

      const updatedProject = await recalculateProjectHealth(
        project.id,
        project.workspaceId,
      );

      logs.push(
        `Done ${project.name}: signals=${signals.length}, health=${
          updatedProject?.healthScore ?? "unknown"
        }, clientMood=${updatedProject?.clientMood ?? "unknown"}, teamMood=${
          updatedProject?.teamMood ?? "unknown"
        }`,
      );

      processedProjects++;
    } catch (error) {
      failedProjects++;
      logs.push(
        `Failed ${project.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  return {
    date: dateKey,
    totalProjects: projects.length,
    processedProjects,
    failedProjects,
    createdSignals,
    logs,
  };
}

export async function generateDailyOperationsForDate(
  options: DailyOperationsOptions,
) {
  const chatSummaries = await generateDailyChatSummariesForDate(options);
  const projectSignals = await generateDailyProjectSignalsForDate(options);

  return {
    ok: chatSummaries.failedProjects === 0 && projectSignals.failedProjects === 0,
    date: projectSignals.date,
    chatSummaries,
    projectSignals,
    logs: [
      "🚀 Chat summaries",
      ...chatSummaries.logs,
      "🚀 Project signals",
      ...projectSignals.logs,
    ],
  };
}

export async function resetProjectHealthBaselines(workspaceId?: string | null) {
  const projects = await prisma.project.findMany({
    where: {
      workspaceId: workspaceId === undefined ? undefined : workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  await prisma.$transaction([
    prisma.projectHealthPoint.deleteMany({
      where: {
        project: {
          workspaceId: workspaceId === undefined ? undefined : workspaceId,
          deletedAt: null,
        },
      },
    }),
    prisma.project.updateMany({
      where: {
        workspaceId: workspaceId === undefined ? undefined : workspaceId,
        deletedAt: null,
      },
      data: {
        healthScore: 100,
        healthTrend: "flat",
        healthLabel: "stable",
        healthSummary: "Показатели проекта сброшены к базовому уровню.",
        healthCalculatedAt: null,
        clientMood: "neutral",
        teamMood: "neutral",
        risk: "low",
      },
    }),
  ]);

  return {
    ok: true,
    resetProjects: projects.length,
    logs: [
      `Reset projects: ${projects.length}`,
      ...projects.map((project: { name: string }) => `Reset ${project.name}`),
    ],
  };
}

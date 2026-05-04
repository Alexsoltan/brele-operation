import { prisma } from "@/lib/prisma";
import type { SignalType } from "@/lib/types";

type DefaultSignalWeight = {
  type: SignalType;
  weight: number;
  clientMoodImpact: number;
  teamMoodImpact: number;
  label: string;
  sortOrder: number;
};

export const defaultSignalWeightConfig: DefaultSignalWeight[] = [
  {
    type: "client_dissatisfaction",
    weight: -18,
    clientMoodImpact: -20,
    teamMoodImpact: -4,
    label: "Клиент недоволен",
    sortOrder: 10,
  },
  {
    type: "client_satisfaction",
    weight: 10,
    clientMoodImpact: 14,
    teamMoodImpact: 2,
    label: "Клиент доволен",
    sortOrder: 20,
  },
  {
    type: "team_demotivation",
    weight: -12,
    clientMoodImpact: -2,
    teamMoodImpact: -18,
    label: "Демотивация команды",
    sortOrder: 30,
  },
  {
    type: "team_confidence",
    weight: 8,
    clientMoodImpact: 2,
    teamMoodImpact: 14,
    label: "Уверенность команды",
    sortOrder: 40,
  },
  {
    type: "deadline_risk",
    weight: -16,
    clientMoodImpact: -8,
    teamMoodImpact: -6,
    label: "Риск сроков",
    sortOrder: 50,
  },
  {
    type: "blocker",
    weight: -22,
    clientMoodImpact: -10,
    teamMoodImpact: -10,
    label: "Блокер",
    sortOrder: 60,
  },
  {
    type: "quality_issue",
    weight: -14,
    clientMoodImpact: -10,
    teamMoodImpact: -4,
    label: "Проблема качества",
    sortOrder: 70,
  },
  {
    type: "budget_risk",
    weight: -14,
    clientMoodImpact: -8,
    teamMoodImpact: -4,
    label: "Риск бюджета",
    sortOrder: 80,
  },
  {
    type: "communication_gap",
    weight: -8,
    clientMoodImpact: -6,
    teamMoodImpact: -4,
    label: "Проблема коммуникации",
    sortOrder: 90,
  },
  {
    type: "decision_made",
    weight: 6,
    clientMoodImpact: 2,
    teamMoodImpact: 4,
    label: "Решение принято",
    sortOrder: 100,
  },
  {
    type: "positive_feedback",
    weight: 10,
    clientMoodImpact: 12,
    teamMoodImpact: 4,
    label: "Позитивный фидбек",
    sortOrder: 110,
  },
  {
    type: "upsell_opportunity",
    weight: 8,
    clientMoodImpact: 8,
    teamMoodImpact: 2,
    label: "Upsell возможность",
    sortOrder: 120,
  },
];

export async function ensureSignalWeightConfig(workspaceId?: string | null) {
  await Promise.all(
    defaultSignalWeightConfig.map((item) =>
      prisma.signalWeightConfig.upsert({
        where: {
          workspaceId_type: {
            workspaceId: workspaceId ?? null,
            type: item.type,
          },
        },
        update: {},
        create: {
          workspaceId: workspaceId ?? null,
          type: item.type,
          weight: item.weight,
          clientMoodImpact: item.clientMoodImpact,
          teamMoodImpact: item.teamMoodImpact,
          label: item.label,
          sortOrder: item.sortOrder,
        },
      }),
    ),
  );
}

export async function getSignalWeightConfig(workspaceId?: string | null) {
  await ensureSignalWeightConfig(workspaceId ?? null);

  return prisma.signalWeightConfig.findMany({
    where: {
      workspaceId: workspaceId ?? null,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }, { type: "asc" }],
  });
}
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";
import type {
  SignalCategory,
  SignalDirection,
  SignalSeverity,
  SignalType,
} from "@/lib/types";
import { getSignalWeightConfig } from "@/lib/signal-weight-config";

function normalizeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET — получить веса сигналов
 */
export async function GET() {
  const user = await requireCanRead();

  const items = await getSignalWeightConfig(user.workspaceId ?? null);

  return NextResponse.json(items);
}

/**
 * PATCH — обновить веса и пересчитать проекты
 */
export async function PATCH(req: NextRequest) {
  const user = await requireCanManageProjects();
  const body = await req.json();

  const items = Array.isArray(body?.items) ? body.items : [];

  await Promise.all(
    items.map(
      (item: {
        id: string;
        weight?: number;
        clientMoodImpact?: number;
        teamMoodImpact?: number;
      }) =>
        prisma.signalWeightConfig.update({
          where: { id: item.id },
          data: {
            weight: normalizeNumber(item.weight),
            clientMoodImpact: normalizeNumber(item.clientMoodImpact),
            teamMoodImpact: normalizeNumber(item.teamMoodImpact),
          },
        }),
    ),
  );

  // 🔥 пересчитываем ВСЕ проекты workspace
  const projects = await prisma.project.findMany({
    where: {
      workspaceId: user.workspaceId ?? null,
      deletedAt: null,
    },
    select: { id: true },
  });

  await Promise.all(
    projects.map((p: { id: string }) =>
      recalculateProjectHealth(p.id, user.workspaceId),
    ),
  );

  return NextResponse.json({
    success: true,
    recalculatedProjects: projects.length,
  });
}
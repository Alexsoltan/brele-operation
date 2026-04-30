import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";
import {
  defaultProjectScoringConfig,
  ensureProjectScoringConfig,
  getProjectScoringConfig,
} from "@/lib/project-scoring-config";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";

function normalizeValue(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return numberValue;
}

export async function GET() {
  const user = await requireCanRead();

  const configs = await getProjectScoringConfig(user.workspaceId ?? null);

  return NextResponse.json(configs);
}
export async function PATCH(req: NextRequest) {
  const user = await requireCanManageProjects();
  const body = await req.json();

  const items = Array.isArray(body?.items) ? body.items : [];

  await ensureProjectScoringConfig(user.workspaceId ?? null);

  await Promise.all(
    defaultProjectScoringConfig.map((defaultItem) => {
      const incomingItem = items.find(
        (item: { key?: string }) => item?.key === defaultItem.key,
      );

      return prisma.projectScoringConfig.update({
        where: {
          workspaceId_key: {
            workspaceId: user.workspaceId ?? null,
            key: defaultItem.key,
          },
        },
        data: {
          value: normalizeValue(incomingItem?.value ?? defaultItem.value),
        },
      });
    }),
  );

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: user.workspaceId ?? null,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  await Promise.all(
    projects.map((project: { id: string }) =>
      recalculateProjectHealth(project.id, user.workspaceId ?? null),
    ),
  );

  const configs = await getProjectScoringConfig(user.workspaceId ?? null);

  return NextResponse.json({
    items: configs,
    recalculatedProjects: projects.length,
  });
}
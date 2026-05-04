import { NextRequest, NextResponse } from "next/server";

import { requireCanManageProjects, requireCanRead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectSignal } from "@/lib/project-signals";
import type {
  SignalCategory,
  SignalDirection,
  SignalSeverity,
  SignalType,
} from "@/lib/types";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function GET(
  _req: NextRequest,
  context: { params: { projectId?: string | string[] } },
) {
  const user = await requireCanRead();
  const projectId = normalizeParam(context.params.projectId);

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const signals = await prisma.projectSignal.findMany({
    where: { projectId },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    signals.map((signal: any) => ({
      ...signal,
      occurredAt: signal.occurredAt.toISOString(),
      createdAt: signal.createdAt.toISOString(),
      updatedAt: signal.updatedAt.toISOString(),
    })),
  );
}

export async function POST(
  req: NextRequest,
  context: { params: { projectId?: string | string[] } },
) {
  const user = await requireCanManageProjects();
  const projectId = normalizeParam(context.params.projectId);
  const body = await req.json();

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const signal = await createProjectSignal({
    projectId,
    source: "manual",
    sourceId: null,

    category: (body?.category ?? "communication") as SignalCategory,
    type: (body?.type ?? "communication_gap") as SignalType,
    direction: (body?.direction ?? "neutral") as SignalDirection,
    severity: (body?.severity ?? "medium") as SignalSeverity,
    status: "active",

    title:
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Ручной сигнал",
    text:
      typeof body?.text === "string" && body.text.trim()
        ? body.text.trim()
        : "Ручной сигнал без описания",

    confidence: null,
    occurredAt:
      typeof body?.occurredAt === "string"
        ? body.occurredAt
        : new Date().toISOString(),
  });

  await recalculateProjectHealth(projectId, user.workspaceId);

  return NextResponse.json(signal);
}
import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Mood, Risk } from "@/lib/types";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type HealthPointResponse = {
  id: string;
  date: string;
  score: number;
  delta: number;
  impact: number;
  meetingId?: string | null;
  risk: Risk;
  clientMood: Mood;
  teamMood: Mood;
  hasClient: boolean;
};

export async function GET(
  _req: NextRequest,
  context: {
    params: {
      projectId?: string | string[];
    };
  },
) {
  const user = await requireCanRead();
  const projectId = normalizeParam(context.params.projectId);

  if (!projectId) {
    return NextResponse.json(
      { error: "Project id is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });
  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const points = await prisma.projectHealthPoint.findMany({
    where: {
      projectId,
    },
    orderBy: {
      date: "asc",
    },
    select: {
      id: true,
      date: true,
      score: true,
      delta: true,
      impact: true,
      meetingId: true,
      risk: true,
      clientMood: true,
      teamMood: true,
      hasClient: true,
    },
  });

  const response: HealthPointResponse[] = points.map(
    (point: {
      id: string;
      date: Date;
      score: number;
      delta: number;
      impact: number;
      meetingId: string | null;
      risk: Risk;
      clientMood: Mood;
      teamMood: Mood;
      hasClient: boolean;
    }) => ({
      id: point.id,
      date: point.date.toISOString(),
      score: point.score,
      delta: point.delta,
      impact: point.impact,
      meetingId: point.meetingId,
      risk: point.risk,
      clientMood: point.clientMood,
      teamMood: point.teamMood,
      hasClient: point.hasClient,
    }),
  );

  return NextResponse.json(response);
}
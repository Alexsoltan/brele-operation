import { prisma } from "@/lib/prisma";
import { calculateProjectHealth } from "@/lib/project-health";
import type { Risk, Mood, MeetingAnalysisStatus } from "@/lib/types";

type MeetingForHealth = {
  date: Date;
  risk: Risk;
  clientMood: Mood;
  teamMood: Mood;
  hasClient: boolean;
  analysisStatus: MeetingAnalysisStatus;
  highlights: string[];
};

export async function recalculateProjectHealth(
  projectId: string,
  workspaceId?: string | null,
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      ...(workspaceId ? { workspaceId } : {}),
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!project) {
    return null;
  }

  const meetings = (await prisma.meeting.findMany({
    where: {
      projectId: project.id,
      workspaceId: project.workspaceId,
      deletedAt: null,
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
      risk: true,
      clientMood: true,
      teamMood: true,
      hasClient: true,
      analysisStatus: true,
      highlights: true,
    },
  })) as MeetingForHealth[];

  const health = calculateProjectHealth(
    meetings.map((meeting) => ({
      date: meeting.date.toISOString(),
      risk: meeting.risk,
      clientMood: meeting.clientMood,
      teamMood: meeting.teamMood,
      hasClient: meeting.hasClient,
      analysisStatus: meeting.analysisStatus,
      highlights: meeting.highlights,
    })),
  );

  return prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      healthScore: health.score,
      healthTrend: health.trend,
      healthLabel: health.label,
      healthSummary: health.summary,
      healthCalculatedAt: new Date(),
    },
  });
}
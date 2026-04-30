import { prisma } from "@/lib/prisma";
import { calculateProjectHealth } from "@/lib/project-health";
import { getProjectScoringWeights } from "@/lib/project-scoring-config";
import type { MeetingAnalysisStatus, Mood, Risk } from "@/lib/types";

type RecalculateMeeting = {
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
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      workspaceId: true,
    },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const resolvedWorkspaceId = workspaceId ?? project.workspaceId ?? null;

  const meetings = await prisma.meeting.findMany({
    where: {
      projectId,
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
  });
    const weights = await getProjectScoringWeights(resolvedWorkspaceId);

  const result = calculateProjectHealth(
    meetings.map((meeting: RecalculateMeeting) => ({
      date: meeting.date.toISOString(),
      risk: meeting.risk,
      clientMood: meeting.clientMood,
      teamMood: meeting.teamMood,
      hasClient: meeting.hasClient,
      analysisStatus: meeting.analysisStatus,
      highlights: meeting.highlights,
    })),
    weights,
  );

  return prisma.project.update({
    where: {
      id: project.id,
    },
    data: {
      healthScore: result.score,
      healthTrend: result.trend,
      healthLabel: result.label,
      healthSummary: result.summary,
      healthCalculatedAt: new Date(),
    },
  });
}
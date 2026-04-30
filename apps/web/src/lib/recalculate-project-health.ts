import { prisma } from "@/lib/prisma";
import {
  calculateProjectHealth,
  clampHealthScore,
  meetingImpact,
} from "@/lib/project-health";
import { getProjectScoringWeights } from "@/lib/project-scoring-config";
import type { MeetingAnalysisStatus, Mood, Risk } from "@/lib/types";

type RecalculateMeeting = {
  id: string;
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
      id: true,
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
  const normalizedMeetings: Array<{
  id: string;
  date: string;
  risk: Risk;
  clientMood: Mood;
  teamMood: Mood;
  hasClient: boolean;
  analysisStatus: MeetingAnalysisStatus;
  highlights: string[];
}> = meetings.map((meeting: RecalculateMeeting) => ({
  }));

  const result = calculateProjectHealth(normalizedMeetings, weights);

  let currentScore = 100;

  const healthPoints = normalizedMeetings
    .filter((meeting) => meeting.analysisStatus !== "pending")
    .filter((meeting) => meeting.analysisStatus !== "error")
    .map((meeting) => {
      const impact = meetingImpact(meeting, weights);
      const previousScore = currentScore;

      currentScore = clampHealthScore(currentScore + impact);

      return {
        projectId: project.id,
        meetingId: meeting.id,
        date: new Date(meeting.date),
        score: currentScore,
        delta: currentScore - previousScore,
        impact,
        risk: meeting.risk,
        clientMood: meeting.clientMood,
        teamMood: meeting.teamMood,
        hasClient: meeting.hasClient,
      };
    });

  await prisma.$transaction([
    prisma.projectHealthPoint.deleteMany({
      where: {
        projectId: project.id,
      },
    }),

    ...(healthPoints.length > 0
      ? [
          prisma.projectHealthPoint.createMany({
            data: healthPoints,
          }),
        ]
      : []),

    prisma.project.update({
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
    }),
  ]);

  return prisma.project.findUnique({
    where: {
      id: project.id,
    },
  });
}
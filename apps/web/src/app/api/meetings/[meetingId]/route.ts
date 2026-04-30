import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageMeetings, requireCanRead } from "@/lib/auth";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";

function isMood(value: unknown): value is Mood {
  return value === "good" || value === "neutral" || value === "bad";
}

function isRisk(value: unknown): value is Risk {
  return value === "low" || value === "medium" || value === "high";
}

export async function GET(
  _req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const user = await requireCanRead();

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    include: {
      project: true,
      type: true,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}

export async function PATCH(
  req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const user = await requireCanManageMeetings();
  const body = await req.json();

  const existingMeeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    include: {
      project: true,
      type: true,
    },
  });

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const nextHasClient =
    typeof body?.hasClient === "boolean"
      ? body.hasClient
      : existingMeeting.hasClient;

  const nextClientMood = isMood(body?.clientMood)
    ? body.clientMood
    : existingMeeting.clientMood;

  const nextTeamMood = isMood(body?.teamMood)
    ? body.teamMood
    : existingMeeting.teamMood;

  const nextRisk = isRisk(body?.risk) ? body.risk : existingMeeting.risk;

    const meeting = await prisma.$transaction(async (tx: typeof prisma) => {
    const updatedMeeting = await tx.meeting.update({
      where: {
        id: context.params.meetingId,
      },
      data: {
        title: typeof body?.title === "string" ? body.title : undefined,
        meetingType:
          typeof body?.meetingType === "string" ? body.meetingType : undefined,
        hasClient:
          typeof body?.hasClient === "boolean" ? body.hasClient : undefined,
        date: body?.date ? new Date(body.date) : undefined,
        transcriptText:
          typeof body?.transcriptText === "string"
            ? body.transcriptText
            : undefined,
        summary: typeof body?.summary === "string" ? body.summary : undefined,
        highlights: Array.isArray(body?.highlights)
          ? body.highlights
          : undefined,
        clientMood: isMood(body?.clientMood) ? body.clientMood : undefined,
        teamMood: isMood(body?.teamMood) ? body.teamMood : undefined,
        risk: isRisk(body?.risk) ? body.risk : undefined,
        analysisStatus: body?.analysisStatus,
        modelName:
          typeof body?.modelName === "string" ? body.modelName : undefined,
        analyzedAt:
          body?.analyzedAt === null
            ? null
            : body?.analyzedAt
              ? new Date(body.analyzedAt)
              : undefined,
      },
      include: {
        project: true,
        type: true,
      },
    });

    const shouldUpdateProjectState =
      body?.analysisStatus === "analyzed" ||
      isMood(body?.clientMood) ||
      isMood(body?.teamMood) ||
      isRisk(body?.risk);

    if (shouldUpdateProjectState) {
      await tx.project.update({
        where: {
          id: existingMeeting.projectId,
        },
        data: {
          ...(nextHasClient ? { clientMood: nextClientMood } : {}),
          teamMood: nextTeamMood,
          risk: nextRisk,
        },
      });
    }

    return updatedMeeting;
  });

  return NextResponse.json(meeting);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const user = await requireCanManageMeetings();

  const existingMeeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const meeting = await prisma.meeting.update({
    where: {
      id: context.params.meetingId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json(meeting);
}
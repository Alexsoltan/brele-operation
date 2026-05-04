import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageMeetings, requireCanRead } from "@/lib/auth";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";
import { extractSignalsFromMeeting } from "@/lib/signal-extractors";

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
  });

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const meeting = await prisma.meeting.update({
    where: {
      id: context.params.meetingId,
    },
    data: {
      title: typeof body?.title === "string" ? body.title : undefined,
      meetingType:
        typeof body?.meetingType === "string" ? body.meetingType : undefined,
      meetingTypeId:
        typeof body?.meetingTypeId === "string"
          ? body.meetingTypeId || null
          : undefined,
      hasClient:
        typeof body?.hasClient === "boolean" ? body.hasClient : undefined,
      date: body?.date ? new Date(body.date) : undefined,
      transcriptText:
        typeof body?.transcriptText === "string"
          ? body.transcriptText
          : undefined,
      summary: typeof body?.summary === "string" ? body.summary : undefined,
      highlights: Array.isArray(body?.highlights) ? body.highlights : undefined,
      clientMood: body?.clientMood,
      teamMood: body?.teamMood,
      risk: body?.risk,
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

    if (
      (meeting.analysisStatus === "analyzed" ||
        meeting.analysisStatus === "manual") &&
      Array.isArray(meeting.highlights) &&
      meeting.highlights.length > 0
    ) {
      await extractSignalsFromMeeting({
        ...meeting,
        date: meeting.date.toISOString(),
        analyzedAt: meeting.analyzedAt?.toISOString() ?? null,
        project: meeting.project,
      });
    }

  await recalculateProjectHealth(existingMeeting.projectId, user.workspaceId);

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

  await recalculateProjectHealth(existingMeeting.projectId, user.workspaceId);

  return NextResponse.json(meeting);
}
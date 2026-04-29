import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentWorkspaceId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const workspaceId = await getCurrentWorkspaceId();

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId,
      deletedAt: null,
    },
    include: {
      project: true,
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
  const workspaceId = await getCurrentWorkspaceId();
  const body = await req.json();

  const existingMeeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId,
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
    },
  });

  return NextResponse.json(meeting);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const workspaceId = await getCurrentWorkspaceId();

  const existingMeeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId,
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
import { NextRequest, NextResponse } from "next/server";

import { requireCanManageMeetings } from "@/lib/auth";
import { analyzeAndSaveMeeting } from "@/lib/meeting-analysis";
import { prisma } from "@/lib/prisma";

function parseDraftDate(value: Date | null, fallback: Date) {
  if (!value) return fallback;
  return value;
}

export async function POST(
  req: NextRequest,
  context: { params: { draftId: string } },
) {
  const user = await requireCanManageMeetings();
  const body = await req.json();
  const isAdmin = user.role === "ADMIN";

  const projectId = String(body?.projectId ?? "").trim();
  const meetingTypeId = String(body?.meetingTypeId ?? "").trim();
  const title = String(body?.title ?? "").trim();

  if (!projectId || !meetingTypeId) {
    return NextResponse.json(
      { error: "Project and meeting type are required" },
      { status: 400 },
    );
  }

  const [draft, project, meetingType] = await Promise.all([
    prisma.inboundMeetingDraft.findFirst({
      where: {
        id: context.params.draftId,
        workspaceId: user.workspaceId,
        deletedAt: null,
        status: "new",
        ...(isAdmin ? {} : { managerUserId: user.id }),
      },
    }),
    prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId: user.workspaceId,
        deletedAt: null,
      },
    }),
    prisma.meetingType.findFirst({
      where: {
        id: meetingTypeId,
        workspaceId: user.workspaceId,
        deletedAt: null,
      },
    }),
  ]);

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!meetingType) {
    return NextResponse.json({ error: "Meeting type not found" }, { status: 404 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: user.workspaceId,
      projectId,
      meetingTypeId,
      title: title || meetingType.name,
      date: body?.date ? new Date(body.date) : parseDraftDate(draft.emailDate, new Date()),
      meetingType: meetingType.slug,
      hasClient: meetingType.hasClient,
      transcriptText: draft.transcriptText,
      summary: "AI-анализ встречи выполняется...",
      highlights: [],
      clientMood: "neutral",
      teamMood: "neutral",
      risk: "low",
      analysisStatus: "pending",
      modelName: null,
      analyzedAt: null,
    },
    include: {
      project: true,
      type: true,
    },
  });

  const updatedDraft = await prisma.inboundMeetingDraft.update({
    where: {
      id: draft.id,
    },
    data: {
      status: "linked",
      linkedMeetingId: meeting.id,
      processedAt: new Date(),
      error: null,
    },
  });

  const analyzedMeeting = await analyzeAndSaveMeeting(meeting.id);

  return NextResponse.json(
    {
      draft: updatedDraft,
      meeting: analyzedMeeting,
    },
    { status: 201 },
  );
}

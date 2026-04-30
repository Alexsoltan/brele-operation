import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageMeetings, requireCanRead } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await requireCanRead();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const meetings = await prisma.meeting.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      project: {
        workspaceId: user.workspaceId,
        deletedAt: null,
      },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      project: true,
      type: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const user = await requireCanManageMeetings();
  const body = await req.json();

  const projectId = String(body?.projectId ?? "").trim();
  const meetingTypeId = String(body?.meetingTypeId ?? "").trim();
  const title = String(body?.title ?? "Встреча").trim();
  const meetingType = String(body?.meetingType ?? "meeting").trim();
  const transcriptText = String(body?.transcriptText ?? body?.text ?? "").trim();

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let hasClient = body?.hasClient !== false;

  if (meetingTypeId) {
    const type = await prisma.meetingType.findFirst({
      where: {
        id: meetingTypeId,
        workspaceId: user.workspaceId,
        deletedAt: null,
      },
    });

    if (!type) {
      return NextResponse.json(
        { error: "Meeting type not found" },
        { status: 404 },
      );
    }

    hasClient = type.hasClient;
  }

  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: user.workspaceId,
      projectId,
      meetingTypeId: meetingTypeId || null,
      title,
      date: body?.date ? new Date(body.date) : new Date(),
      meetingType,
      hasClient,
      transcriptText,
      summary: body?.summary ?? "AI-анализ встречи выполняется...",
      highlights: Array.isArray(body?.highlights) ? body.highlights : [],
      clientMood: body?.clientMood ?? "neutral",
      teamMood: body?.teamMood ?? "neutral",
      risk: body?.risk ?? "low",
      analysisStatus: body?.analysisStatus ?? "pending",
      modelName: body?.modelName ?? null,
      analyzedAt: body?.analyzedAt ? new Date(body.analyzedAt) : null,
    },
    include: {
      project: true,
      type: true,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
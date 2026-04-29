import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const meetings = await prisma.meeting.findMany({
    where: {
      deletedAt: null,
      project: {
        deletedAt: null,
      },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      project: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const projectId = String(body?.projectId ?? "").trim();
  const title = String(body?.title ?? "Встреча").trim();
  const meetingType = String(body?.meetingType ?? "sync").trim();
  const transcriptText = String(body?.transcriptText ?? body?.text ?? "").trim();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      projectId,
      title,
      date: body?.date ? new Date(body.date) : new Date(),
      meetingType,
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
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
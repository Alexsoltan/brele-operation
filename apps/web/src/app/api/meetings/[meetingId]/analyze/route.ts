import { NextRequest, NextResponse } from "next/server";

import { requireCanManageMeetings } from "@/lib/auth";
import { analyzeAndSaveMeeting } from "@/lib/meeting-analysis";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: { meetingId: string } },
) {
  const user = await requireCanManageMeetings();

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: context.params.meetingId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      summary: "AI-анализ встречи выполняется...",
      highlights: [],
      analysisStatus: "pending",
      modelName: "",
      analyzedAt: null,
    },
  });

  const analyzedMeeting = await analyzeAndSaveMeeting(meeting.id);

  return NextResponse.json(analyzedMeeting);
}

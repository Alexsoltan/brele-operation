import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ projectId: string; participantId: string }>;
  },
) {
  const user = await requireCanManageProjects();
  const { participantId } = await context.params;
  const body = await req.json();

  const role = String(body?.role ?? "");

  if (!["client", "team", "ignore", "unknown"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 },
    );
  }

  const participant = await prisma.projectChatParticipant.update({
    where: {
      id: participantId,
    },
    data: {
      role,
    },
  });

  return NextResponse.json(participant);
}
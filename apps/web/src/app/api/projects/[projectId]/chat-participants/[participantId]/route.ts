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
  const { projectId, participantId } = await context.params;
  const body = await req.json();

  const role = String(body?.role ?? "");

  if (!["client", "team", "ignore", "unknown"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 },
    );
  }

  const participant = await prisma.projectChatParticipant.findFirst({
    where: {
      id: participantId,
      chat: {
        projectId,
        project: {
          workspaceId: user.workspaceId,
        },
      },
    },
  });

  if (!participant) {
    return NextResponse.json(
      { error: "Participant not found" },
      { status: 404 },
    );
  }

  await prisma.projectChatParticipant.updateMany({
    where: {
      telegramUserId: participant.telegramUserId,
      chat: {
        projectId,
        project: {
          workspaceId: user.workspaceId,
        },
      },
    },
    data: {
      role,
    },
  });

  return NextResponse.json({
    ...participant,
    role,
    updatedAt: new Date().toISOString(),
  });
}

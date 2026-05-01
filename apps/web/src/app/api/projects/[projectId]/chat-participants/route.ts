import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanRead } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanRead();
  const { projectId } = await context.params;

  const participants = await prisma.projectChatParticipant.findMany({
    where: {
      chat: {
        projectId,
        project: {
          workspaceId: user.workspaceId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(participants);
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string; chatId: string }> },
) {
  const user = await requireCanManageProjects();
  const { projectId, chatId } = await context.params;

  const chat = await prisma.projectChat.findFirst({
    where: {
      id: chatId,
      projectId,
      project: {
        workspaceId: user.workspaceId,
        deletedAt: null,
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const updatedChat = await prisma.projectChat.update({
    where: {
      id: chat.id,
    },
    data: {
      isActive: false,
    },
  });

  return NextResponse.json(updatedChat);
}
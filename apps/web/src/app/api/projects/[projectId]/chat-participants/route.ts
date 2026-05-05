import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanRead } from "@/lib/auth";

type Participant = {
  id: string;
  projectChatId: string;
  telegramUserId: string;
  username: string | null;
  name: string | null;
  role: "client" | "team" | "unknown" | "ignore";
  createdAt: Date;
  updatedAt: Date;
};

function mergeParticipant(current: Participant, next: Participant) {
  const currentRoleIsKnown = current.role !== "unknown";
  const nextRoleIsKnown = next.role !== "unknown";
  const role =
    nextRoleIsKnown && (!currentRoleIsKnown || next.updatedAt > current.updatedAt)
      ? next.role
      : current.role;

  return {
    ...current,
    id: current.updatedAt >= next.updatedAt ? current.id : next.id,
    projectChatId:
      current.updatedAt >= next.updatedAt
        ? current.projectChatId
        : next.projectChatId,
    username: current.username ?? next.username,
    name: current.name ?? next.name,
    role,
    createdAt: current.createdAt < next.createdAt ? current.createdAt : next.createdAt,
    updatedAt: current.updatedAt > next.updatedAt ? current.updatedAt : next.updatedAt,
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanRead();
  const { projectId } = await context.params;

  const participants = (await prisma.projectChatParticipant.findMany({
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
  })) as Participant[];

  const participantsByTelegramUser = new Map<string, Participant>();

  for (const participant of participants) {
    const existing = participantsByTelegramUser.get(participant.telegramUserId);

    participantsByTelegramUser.set(
      participant.telegramUserId,
      existing ? mergeParticipant(existing, participant) : participant,
    );
  }

  return NextResponse.json([...participantsByTelegramUser.values()]);
}

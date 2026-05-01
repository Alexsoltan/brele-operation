import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanRead();
  const { projectId } = await context.params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chats = await prisma.projectChat.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(chats);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  const user = await requireCanManageProjects();
  const { projectId } = await context.params;
  const body = await req.json();

  const telegramChatId = String(body?.telegramChatId ?? "").trim();
  const title = String(body?.title ?? "").trim();

  if (!telegramChatId) {
    return NextResponse.json(
      { error: "Telegram Chat ID is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chat = await prisma.projectChat.upsert({
    where: {
      telegramChatId,
    },
    update: {
      projectId,
      title: title || null,
      isActive: true,
    },
    create: {
      projectId,
      telegramChatId,
      title: title || null,
      isActive: true,
    },
  });

  return NextResponse.json(chat);
}
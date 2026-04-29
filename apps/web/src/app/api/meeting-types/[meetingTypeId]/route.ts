import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanManageProjects, requireCanRead } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ meetingTypeId: string }> },
) {
  const user = await requireCanRead();
  const { meetingTypeId } = await context.params;

  const meetingType = await prisma.meetingType.findFirst({
    where: {
      id: meetingTypeId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!meetingType) {
    return NextResponse.json(
      { error: "Meeting type not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(meetingType);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ meetingTypeId: string }> },
) {
  const user = await requireCanManageProjects();
  const { meetingTypeId } = await context.params;
  const body = await req.json();

  const existingMeetingType = await prisma.meetingType.findFirst({
    where: {
      id: meetingTypeId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!existingMeetingType) {
    return NextResponse.json(
      { error: "Meeting type not found" },
      { status: 404 },
    );
  }

  const meetingType = await prisma.meetingType.update({
    where: {
      id: meetingTypeId,
    },
    data: {
      name: typeof body?.name === "string" ? body.name.trim() : undefined,
      description:
        typeof body?.description === "string"
          ? body.description.trim() || null
          : undefined,
      prompt:
        typeof body?.prompt === "string" ? body.prompt.trim() : undefined,
      isDefault:
        typeof body?.isDefault === "boolean" ? body.isDefault : undefined,
    },
  });

  return NextResponse.json(meetingType);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ meetingTypeId: string }> },
) {
  const user = await requireCanManageProjects();
  const { meetingTypeId } = await context.params;

  const existingMeetingType = await prisma.meetingType.findFirst({
    where: {
      id: meetingTypeId,
      workspaceId: user.workspaceId,
      deletedAt: null,
    },
  });

  if (!existingMeetingType) {
    return NextResponse.json(
      { error: "Meeting type not found" },
      { status: 404 },
    );
  }

  await prisma.$transaction([
    prisma.meeting.updateMany({
      where: {
        workspaceId: user.workspaceId,
        meetingTypeId,
      },
      data: {
        meetingTypeId: null,
      },
    }),
    prisma.meetingType.update({
      where: {
        id: meetingTypeId,
      },
      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
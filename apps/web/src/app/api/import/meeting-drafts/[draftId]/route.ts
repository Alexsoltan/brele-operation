import { NextRequest, NextResponse } from "next/server";

import { requireCanManageMeetings } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDraftScope(user: any) {
  return {
    workspaceId: user.workspaceId,
    deletedAt: null,
    ...(user.role === "ADMIN" ? {} : { managerUserId: user.id }),
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: { draftId: string } },
) {
  const user = await requireCanManageMeetings();
  const body = await req.json();

  const draft = await prisma.inboundMeetingDraft.findFirst({
    where: {
      id: context.params.draftId,
      ...getDraftScope(user),
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const status = body?.status;

  if (!["new", "ignored", "error"].includes(status)) {
    return NextResponse.json({ error: "Unsupported status" }, { status: 400 });
  }

  const updatedDraft = await prisma.inboundMeetingDraft.update({
    where: {
      id: draft.id,
    },
    data: {
      status,
      processedAt: status === "new" ? null : new Date(),
      error:
        typeof body?.error === "string" && body.error.trim()
          ? body.error.trim()
          : status === "error"
            ? draft.error
            : null,
    },
  });

  return NextResponse.json(updatedDraft);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: { draftId: string } },
) {
  const user = await requireCanManageMeetings();

  const draft = await prisma.inboundMeetingDraft.findFirst({
    where: {
      id: context.params.draftId,
      ...getDraftScope(user),
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const deletedDraft = await prisma.inboundMeetingDraft.update({
    where: {
      id: draft.id,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json(deletedDraft);
}

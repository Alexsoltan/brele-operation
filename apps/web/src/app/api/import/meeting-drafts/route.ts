import { NextRequest, NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await requireCanRead();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "new";
  const isAdmin = user.role === "ADMIN";

  const drafts = await prisma.inboundMeetingDraft.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      ...(status === "all" ? {} : { status }),
      ...(isAdmin ? {} : { managerUserId: user.id }),
    },
    include: {
      manager: true,
      mailAccount: true,
      linkedMeeting: {
        include: {
          project: true,
          type: true,
        },
      },
    },
    orderBy: [
      {
        emailDate: "desc",
      },
      {
        importedAt: "desc",
      },
    ],
  });

  return NextResponse.json(
    drafts.map((draft: any) => ({
      id: draft.id,
      status: draft.status,
      sourceEmail: draft.sourceEmail,
      fromEmail: draft.fromEmail,
      fromName: draft.fromName,
      emailSubject: draft.emailSubject,
      emailDate: draft.emailDate,
      receivedAt: draft.receivedAt,
      attachmentFileName: draft.attachmentFileName,
      telemostMeetingUrl: draft.telemostMeetingUrl,
      telemostMeetingId: draft.telemostMeetingId,
      transcriptText: draft.transcriptText,
      importedAt: draft.importedAt,
      processedAt: draft.processedAt,
      error: draft.error,
      manager: draft.manager
        ? {
            id: draft.manager.id,
            name: draft.manager.name,
            email: draft.manager.email,
          }
        : null,
      mailAccount: draft.mailAccount
        ? {
            id: draft.mailAccount.id,
            email: draft.mailAccount.email,
            displayName: draft.mailAccount.displayName,
          }
        : null,
      linkedMeeting: draft.linkedMeeting,
    })),
  );
}

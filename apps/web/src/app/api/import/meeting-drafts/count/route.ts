import { NextResponse } from "next/server";

import { requireCanRead } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireCanRead();

  const count = await prisma.inboundMeetingDraft.count({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      status: "new",
      ...(user.role === "ADMIN" ? {} : { managerUserId: user.id }),
    },
  });

  return NextResponse.json({ count });
}

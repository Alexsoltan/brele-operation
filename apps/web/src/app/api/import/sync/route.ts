import { NextResponse } from "next/server";

import { requireCanManageMeetings } from "@/lib/auth";
import { importTelemostMeetingDrafts } from "@/lib/mail/telemost-import";

export const runtime = "nodejs";

export async function POST() {
  const user = await requireCanManageMeetings();

  const results = await importTelemostMeetingDrafts({
    workspaceId: user.workspaceId,
    ...(user.role === "ADMIN" ? {} : { userId: user.id }),
  });

  return NextResponse.json({
    results,
    imported: results.reduce((sum, item) => sum + item.imported, 0),
    skipped: results.reduce((sum, item) => sum + item.skipped, 0),
    errors: results.filter((item) => item.error),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { generateDailyChatSummaries } from "@/lib/chat-summary-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured" },
        { status: 500 },
      );
    }

    if (authHeader !== expected) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    await generateDailyChatSummaries();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("CHAT SUMMARY CRON ERROR:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 },
    );
  }
}
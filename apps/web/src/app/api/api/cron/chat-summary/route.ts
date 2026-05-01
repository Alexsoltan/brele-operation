import { NextResponse } from "next/server";
import { generateDailyChatSummaries } from "@/lib/chat-summary-service";

export async function POST() {
  try {
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
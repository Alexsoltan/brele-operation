import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanRead } from "@/lib/auth";
import { ensurePromptConfigs } from "@/lib/prompt-config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireCanRead();
    const workspaceId = user.workspaceId ?? null;

    await ensurePromptConfigs(workspaceId);

    const config = await prisma.promptConfig.findUnique({
      where: {
        workspaceId_key: {
          workspaceId,
          key: "daily_project_analysis",
        },
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("AI ANALYSIS CONFIG GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const workspaceId = user.workspaceId ?? null;
    const body = await req.json();

    const updated = await prisma.promptConfig.upsert({
      where: {
        workspaceId_key: {
          workspaceId,
          key: "daily_project_analysis",
        },
      },
      update: {
        label: "Ежедневный анализ проекта",
        description:
          "Ежедневный анализ полного контекста проекта: встречи, чаты, существующие сигналы и справочник типов сигналов.",
        systemPrompt: String(body.systemPrompt ?? ""),
        userPrompt: String(body.userPrompt ?? ""),
        modelName: String(body.modelName ?? "gpt-4o-mini"),
        isActive: true,
      },
      create: {
        workspaceId,
        key: "daily_project_analysis",
        label: "Ежедневный анализ проекта",
        description:
          "Ежедневный анализ полного контекста проекта: встречи, чаты, существующие сигналы и справочник типов сигналов.",
        systemPrompt: String(body.systemPrompt ?? ""),
        userPrompt: String(body.userPrompt ?? ""),
        modelName: String(body.modelName ?? "gpt-4o-mini"),
        isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("AI ANALYSIS CONFIG PATCH ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to update config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
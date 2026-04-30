import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCanRead } from "@/lib/auth";

export const runtime = "nodejs";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";

type AnalysisResult = {
  summary: string;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  highlights: string[];
  modelName?: string;
};

const fallbackPrompt = `
Ты анализируешь TXT-транскрибацию клиентской встречи для операционной панели Brele.

Оцени встречу по трём ключевым метрикам:
1. clientMood — настроение клиента.
2. teamMood — состояние команды / исполнителя.
3. risk — риск проекта.

Если клиент явно недоволен, clientMood должен быть "bad".
Если есть риск срыва сроков, потери доверия или серьёзного конфликта, risk должен быть "high".
`;

function normalizeMood(value: unknown): Mood {
  if (value === "good" || value === "neutral" || value === "bad") {
    return value;
  }

  return "neutral";
}

function normalizeRisk(value: unknown): Risk {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "low";
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCanRead();
    const body = await req.json();

    const text = body?.text;
    const meetingTypeId =
      typeof body?.meetingTypeId === "string" ? body.meetingTypeId.trim() : "";

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const meetingType = meetingTypeId
      ? await prisma.meetingType.findFirst({
          where: {
            id: meetingTypeId,
            workspaceId: user.workspaceId,
            deletedAt: null,
          },
        })
      : null;

    const aiProxyUrl = process.env.AI_PROXY_URL;
    const aiProxyKey = process.env.AI_PROXY_KEY;

    if (!aiProxyUrl || !aiProxyKey) {
      return NextResponse.json(
        {
          error: "AI proxy is not configured",
          details: "Add AI_PROXY_URL and AI_PROXY_KEY to environment variables.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${aiProxyUrl}/analyze-meeting`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiProxyKey}`,
      },
      body: JSON.stringify({
        text,
        prompt: meetingType?.prompt?.trim() || fallbackPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI PROXY ANALYZE ERROR:", data);

      return NextResponse.json(
        {
          error: "AI proxy error",
          details: data,
        },
        { status: 500 },
      );
    }

    const parsed = data as Partial<AnalysisResult>;

    return NextResponse.json({
      summary: parsed.summary || "Саммари не получено.",
      clientMood: normalizeMood(parsed.clientMood),
      teamMood: normalizeMood(parsed.teamMood),
      risk: normalizeRisk(parsed.risk),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      modelName:
        meetingType && parsed.modelName
          ? `${parsed.modelName} / ${meetingType.name}`
          : parsed.modelName || "AI proxy",
    });
  } catch (error) {
    console.error("ANALYZE MEETING ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
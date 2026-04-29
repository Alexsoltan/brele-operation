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
};

const baseJsonRules = `
Верни ТОЛЬКО валидный JSON без markdown и без пояснений.

Формат ответа:
{
  "summary": "краткое саммари встречи на русском языке",
  "clientMood": "good | neutral | bad",
  "teamMood": "good | neutral | bad",
  "risk": "low | medium | high",
  "highlights": [
    "ключевой инсайт 1 на русском языке",
    "ключевой инсайт 2 на русском языке"
  ]
}

Enum-значения clientMood/teamMood/risk должны быть только на английском.
`;

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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        summary: "Нет API-ключа. Показан тестовый анализ.",
        clientMood: "neutral",
        teamMood: "neutral",
        risk: "low",
        highlights: ["Добавь OPENAI_API_KEY в apps/web/.env.local"],
        modelName: "fallback",
      });
    }

    const systemPrompt = `
${meetingType?.prompt?.trim() || fallbackPrompt}

${baseJsonRules}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: text.slice(0, 20000),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);

      return NextResponse.json(
        {
          error: "OpenAI error",
          details: data,
        },
        { status: 500 },
      );
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        {
          error: "Empty response from AI",
          details: data,
        },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(content) as Partial<AnalysisResult>;

    return NextResponse.json({
      summary: parsed.summary || "Саммари не получено.",
      clientMood: normalizeMood(parsed.clientMood),
      teamMood: normalizeMood(parsed.teamMood),
      risk: normalizeRisk(parsed.risk),
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      modelName: meetingType ? `gpt-4o-mini / ${meetingType.name}` : "gpt-4o-mini",
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
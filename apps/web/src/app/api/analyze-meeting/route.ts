import { NextRequest, NextResponse } from "next/server";

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
    const body = await req.json();
    const text = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        summary: "Нет API-ключа. Показан тестовый анализ.",
        clientMood: "neutral",
        teamMood: "neutral",
        risk: "low",
        highlights: ["Добавь OPENAI_API_KEY в apps/web/.env.local"],
      });
    }

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
            content: `
Ты анализируешь TXT-транскрибацию клиентской встречи для операционной панели Brele.

Твоя задача — вернуть ТОЛЬКО валидный JSON без markdown и без пояснений.

Оцени встречу по трём ключевым метрикам:

1. clientMood — настроение клиента:
- "good" — клиент доволен, согласен, доверяет, позитивно реагирует, принимает решения.
- "neutral" — клиент спокоен, без явного негатива или сильного позитива, обсуждает рабочие вопросы.
- "bad" — клиент недоволен, раздражён, сомневается, говорит о проблемах, задержках, рисках, плохом опыте, потере доверия.

2. teamMood — состояние команды / исполнителя:
- "good" — команда уверена, контролирует ситуацию, предлагает решения, есть ясный план.
- "neutral" — команда отвечает рабоче, без явной уверенности или тревоги.
- "bad" — команда оправдывается, не контролирует ситуацию, нет плана, есть напряжение, демотивация, неясность.

3. risk — риск проекта:
- "low" — договорённости ясны, конфликтов нет, клиент доверяет, следующие шаги понятны.
- "medium" — есть вопросы, неопределённость, тревожные сигналы, но ситуация управляемая.
- "high" — есть сильное недовольство, риск потери клиента, срыв сроков, отсутствие доверия, конфликт или критичная проблема.

Важно:
- Если в highlights или summary есть признаки недовольства клиента, clientMood НЕ может быть "good".
- Если клиент явно недоволен, clientMood должен быть "bad".
- Если есть риск срыва сроков, потери доверия или серьёзного конфликта, risk должен быть "high".
- Если команда не даёт ясного плана или звучит неуверенно, teamMood должен быть "neutral" или "bad".
- Не используй русские значения для clientMood/teamMood/risk. Только enum-значения.

Верни JSON строго такого вида:
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
`,
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
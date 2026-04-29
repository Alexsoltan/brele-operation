import { NextRequest, NextResponse } from "next/server";
import { requireCanManageProjects } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireCanManageProjects();

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Название типа встречи обязательно" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        prompt: `Ты анализируешь встречу типа «${name}».

Контекст типа встречи:
${description || "Описание не указано."}

Оцени встречу по трём ключевым метрикам:
1. clientMood — настроение клиента.
2. teamMood — состояние команды / исполнителя.
3. risk — риск проекта.

Особенно внимательно оцени:
- явное недовольство клиента;
- потерю доверия;
- риски сроков, бюджета или результата;
- уверенность команды;
- наличие понятных следующих шагов.

Верни только валидный JSON без markdown.`,
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
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `
Ты помогаешь настроить AI-анализ клиентских встреч для B2B SaaS-системы Brele Operations.

Нужно написать качественный system prompt на русском языке для анализа транскрибации встречи.

Prompt должен:
- учитывать тип встречи;
- объяснять, на что AI должен обращать внимание;
- помогать оценивать clientMood, teamMood и risk;
- быть конкретным;
- не содержать markdown;
- быть готовым для использования как system prompt.
`,
          },
          {
            role: "user",
            content: `
Тип встречи: ${name}

Описание типа встречи:
${description || "Описание не указано."}

Сгенерируй prompt для анализа встреч этого типа.
`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("SUGGEST PROMPT OPENAI ERROR:", data);

      return NextResponse.json({
        prompt: `Ты анализируешь встречу типа «${name}».

Контекст типа встречи:
${description || "Описание не указано."}

Оцени настроение клиента, состояние команды и риски проекта. Особое внимание уделяй признакам недовольства, потери доверия, неясных договорённостей, срыва сроков и отсутствия понятного плана действий.

Верни только валидный JSON без markdown.`,
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json({
        prompt: `Ты анализируешь встречу типа «${name}».

Оцени clientMood, teamMood и risk. Выдели ключевые инсайты и краткое саммари на русском языке. Верни только валидный JSON без markdown.`,
      });
    }

    return NextResponse.json({
      prompt: content.trim(),
    });
  } catch (error) {
    console.error("SUGGEST PROMPT ERROR:", error);

    return NextResponse.json({
      prompt:
        "Ты анализируешь клиентскую встречу. Оцени настроение клиента, состояние команды и риски проекта. Верни краткое саммари, clientMood, teamMood, risk и highlights в формате валидного JSON без markdown.",
    });
  }
}
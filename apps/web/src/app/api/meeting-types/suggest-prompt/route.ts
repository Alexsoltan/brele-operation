import { NextRequest, NextResponse } from "next/server";
import { requireCanManageProjects } from "@/lib/auth";

export const runtime = "nodejs";

function fallbackPrompt(name: string, description: string) {
  return `Ты анализируешь встречу типа «${name}».

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

Верни только валидный JSON без markdown.`;
}

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

    const aiProxyUrl = process.env.AI_PROXY_URL;
    const aiProxyKey = process.env.AI_PROXY_KEY;

    if (!aiProxyUrl || !aiProxyKey) {
      return NextResponse.json({
        prompt: fallbackPrompt(name, description),
      });
    }

    const response = await fetch(`${aiProxyUrl}/suggest-prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiProxyKey}`,
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("AI PROXY SUGGEST PROMPT ERROR:", data);

      return NextResponse.json({
        prompt: fallbackPrompt(name, description),
      });
    }

    const prompt = data?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({
        prompt: fallbackPrompt(name, description),
      });
    }

    return NextResponse.json({
      prompt: prompt.trim(),
    });
  } catch (error) {
    console.error("SUGGEST PROMPT ERROR:", error);

    return NextResponse.json({
      prompt:
        "Ты анализируешь клиентскую встречу. Оцени настроение клиента, состояние команды и риски проекта. Верни краткое саммари, clientMood, teamMood, risk и highlights в формате валидного JSON без markdown.",
    });
  }
}
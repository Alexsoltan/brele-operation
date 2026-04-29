import { NextRequest, NextResponse } from "next/server";
import { requireCanManageProjects } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireCanManageProjects();

    const body = await req.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "No name" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        prompt: `Ты анализируешь встречу типа "${name}". Оцени настроение клиента, команды и риски.`,
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
Ты продуктовый аналитик SaaS-платформы.

Твоя задача — написать системный prompt для анализа встречи.

Контекст:
- Есть тип встречи (например: синк, демо, приемка)
- Нужно анализировать:
  - настроение клиента
  - состояние команды
  - риски проекта

Сделай prompt:
- конкретным
- учитывающим специфику типа встречи
- без воды
- готовым для system role

Пиши на русском.
`,
          },
          {
            role: "user",
            content: `Тип встречи: ${name}`,
          },
        ],
      }),
    });

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty AI response");
    }

    return NextResponse.json({
      prompt: content.trim(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 },
    );
  }
}
import { prisma } from "@/lib/prisma";
import type { PromptConfigKey } from "@/lib/types";

type DefaultPromptConfig = {
  key: PromptConfigKey;
  label: string;
  description: string;
  systemPrompt: string;
  userPrompt: string;
  modelName: string;
};

export const defaultPromptConfigs: DefaultPromptConfig[] = [
  {
    key: "meeting_analysis",
    label: "Анализ встречи",
    description:
      "Анализ транскрибации встречи: summary, highlights, локальные оценки и project signals.",
    modelName: "gpt-4o-mini",
    systemPrompt: `
Ты анализируешь TXT-транскрибацию встречи для операционной панели Brele Operations.

Верни ТОЛЬКО валидный JSON без markdown и без пояснений.

Твоя задача:
1. Сделать краткое summary встречи на русском языке.
2. Сформировать highlights — 2-5 ключевых наблюдений на русском языке.
3. Оценить локальные поля встречи:
   - clientMood: "good" | "neutral" | "bad"
   - teamMood: "good" | "neutral" | "bad"
   - risk: "low" | "medium" | "high"
4. Выделить project signals — максимум 3 сигнала, которые действительно важны.

Допустимые type для signals:
client_satisfaction
client_dissatisfaction
client_trust
team_confidence
team_demotivation
deadline_risk
scope_change
quality_issue
blocker
budget_risk
communication_gap
decision_made
escalation
positive_feedback
upsell_opportunity

Правила:
- максимум 3 сигнала
- если нет уверенности — signals = []
- не выдумывать
- не использовать type вне списка

Структура сигнала:
{
  "type": "...",
  "title": "...",
  "text": "...",
  "direction": "positive | negative | neutral",
  "severity": "info | low | medium | high | critical"
}

Верни JSON:
{
  "summary": "...",
  "clientMood": "neutral",
  "teamMood": "neutral",
  "risk": "low",
  "highlights": ["...", "..."],
  "signals": []
}
`.trim(),

    userPrompt: `
Проанализируй транскрибацию встречи:

{{text}}
`.trim(),
  },
    {
    key: "chat_daily_summary",
    label: "Дневное summary чатов",
    description:
      "Анализ дневной переписки Telegram-чатов: summary, highlights и сигналы.",
    modelName: "gpt-4o-mini",
    systemPrompt: `
Ты анализируешь дневную переписку проектных Telegram-чатов.

Верни ТОЛЬКО JSON.

Твоя задача:
- summary дня
- highlights (2-5)
- clientMood / teamMood / risk
- signals (максимум 3)

Используй только допустимые type:
client_satisfaction
client_dissatisfaction
client_trust
team_confidence
team_demotivation
deadline_risk
scope_change
quality_issue
blocker
budget_risk
communication_gap
decision_made
escalation
positive_feedback
upsell_opportunity

Если нет сигналов → signals: []

JSON:
{
  "summary": "...",
  "clientMood": "neutral",
  "teamMood": "neutral",
  "risk": "low",
  "highlights": ["..."],
  "signals": []
}
`.trim(),

    userPrompt: `
Проанализируй переписку:

{{text}}
`.trim(),
  },

{
  key: "daily_project_analysis",
  label: "Ежедневный анализ проекта",
  description:
    "Ежедневный анализ полного контекста проекта: встречи, чаты, существующие сигналы и справочник типов сигналов.",
  modelName: "gpt-4o-mini",
  systemPrompt: `
Ты анализируешь полный дневной контекст проекта для Brele Operations.

Твоя задача — вернуть ТОЛЬКО валидный JSON без markdown и без пояснений.

Ты получишь:
1. Информацию о проекте.
2. Встречи проекта.
3. Сообщения из проектных чатов.
4. Существующие сигналы.
5. Справочник допустимых типов сигналов.

Главное правило:
- Ты НЕ придумываешь типы сигналов.
- Каждый signal.typeKey должен быть выбран только из переданного справочника.
- Если подходящего типа нет — не создавай сигнал.
- Если данных мало — не выдумывай.
- Возвращай максимум 5 сигналов за день.
- Сигналы должны быть конкретными и опираться на факты из контекста.

Верни JSON строго такого вида:
{
  "summary": "краткое дневное резюме проекта на русском языке",
  "signals": [
    {
      "typeKey": "signal_key_from_dictionary",
      "title": "короткий заголовок на русском языке",
      "text": "пояснение на русском языке",
      "confidence": 0.85
    }
  ]
}
`.trim(),
  userPrompt: `
Проект:
{{project}}

Справочник сигналов:
{{signalTypes}}

Встречи:
{{meetings}}

Чаты:
{{chats}}

Существующие сигналы:
{{signals}}

Дата анализа:
{{date}}
`.trim(),
},

];
export async function ensurePromptConfigs(workspaceId?: string | null) {
  await Promise.all(
    defaultPromptConfigs.map((item) =>
      prisma.promptConfig.upsert({
        where: {
          workspaceId_key: {
            workspaceId: workspaceId ?? null,
            key: item.key,
          },
        },
        update: {},
        create: {
          workspaceId: workspaceId ?? null,
          key: item.key,
          label: item.label,
          description: item.description,
          systemPrompt: item.systemPrompt,
          userPrompt: item.userPrompt,
          modelName: item.modelName,
          isActive: true,
        },
      }),
    ),
  );
}

export async function getPromptConfig(
  key: PromptConfigKey,
  workspaceId?: string | null,
) {
  await ensurePromptConfigs(workspaceId ?? null);

  return prisma.promptConfig.findFirst({
    where: {
      workspaceId: workspaceId ?? null,
      key,
      isActive: true,
    },
  });
}

export function renderPromptTemplate(
  template: string,
  values: Record<string, string>,
) {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, value);
  }, template);
}

export async function getAiAnalysisConfig(workspaceId?: string | null) {
  await ensurePromptConfigs(workspaceId ?? null);

  const config = await prisma.promptConfig.findUnique({
    where: {
      workspaceId_key: {
        workspaceId: workspaceId ?? null,
        key: "daily_project_analysis",
      },
    },
  });

  if (!config) {
    throw new Error("Daily project analysis prompt config not found");
  }

  return config;
}
import { prisma } from "@/lib/prisma";
import { getAiAnalysisConfig } from "@/lib/prompt-config";
import { getActiveSignalTypeConfigs } from "@/lib/signal-type-config";

type SignalDirection = "positive" | "negative" | "neutral";

type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

type SignalTypeConfigItem = {
  key: string;
  label: string;
  isHighRisk: boolean;
  direction: SignalDirection;
  description?: string | null;
};

type AiSignal = {
  typeKey: string;
  title?: string;
  text?: string;
  confidence?: number;
};

type AiProxyResponse = {
  content?: string | Record<string, unknown> | null;
  signals?: unknown;
};

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function parseAiContent(content: AiProxyResponse["content"]) {
  if (!content) return {};

  if (typeof content === "object") {
    return content;
  }

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeAiSignals(value: unknown): AiSignal[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Record<string, unknown>;

      return {
        typeKey: typeof raw.typeKey === "string" ? raw.typeKey.trim() : "",
        title: typeof raw.title === "string" ? raw.title : undefined,
        text: typeof raw.text === "string" ? raw.text : undefined,
        confidence:
          typeof raw.confidence === "number" ? raw.confidence : undefined,
      };
    })
    .filter((signal) => signal.typeKey);
}

export async function analyzeProjectDay(projectId: string, date: Date) {
  const { start, end } = getDayRange(date);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const [meetings, chats, existingSignals, signalTypes] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        projectId,
        deletedAt: null,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        date: "asc",
      },
    }),

    prisma.chatMessage.findMany({
      where: {
        chat: {
          projectId,
        },
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        date: "asc",
      },
    }),

    prisma.projectSignal.findMany({
      where: {
        projectId,
        occurredAt: {
          lt: end,
        },
      },
      orderBy: {
        occurredAt: "asc",
      },
    }),

    getActiveSignalTypeConfigs(project.workspaceId ?? null),
  ]);

  if (signalTypes.length === 0) {
    throw new Error("No active signal types configured");
  }

  const config = await getAiAnalysisConfig(project.workspaceId ?? null);

  const userPrompt = config.userPrompt
    .replace("{{project}}", JSON.stringify(project, null, 2))
    .replace("{{signalTypes}}", JSON.stringify(signalTypes, null, 2))
    .replace("{{meetings}}", JSON.stringify(meetings, null, 2))
    .replace("{{chats}}", JSON.stringify(chats, null, 2))
    .replace("{{signals}}", JSON.stringify(existingSignals, null, 2))
    .replace("{{date}}", start.toISOString().slice(0, 10));

  const aiProxyUrl = process.env.AI_PROXY_URL;
  const aiProxyKey = process.env.AI_PROXY_KEY;

  if (!aiProxyUrl || !aiProxyKey) {
    throw new Error("AI proxy is not configured");
  }

  const response = await fetch(`${aiProxyUrl}/chat-json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiProxyKey}`,
    },
    body: JSON.stringify({
      model: config.modelName ?? "gpt-4o-mini",
      temperature: 0.1,
      system: config.systemPrompt,
      user: userPrompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI proxy failed: ${response.status}`);
  }

  const data = (await response.json()) as AiProxyResponse;
  const parsed = parseAiContent(data.content);

  const rawSignals = normalizeAiSignals(
    Array.isArray(parsed.signals) ? parsed.signals : data.signals,
  );

  const signalTypeByKey = new Map<string, SignalTypeConfigItem>(
    signalTypes.map((item: SignalTypeConfigItem) => [
      item.key,
      {
        key: item.key,
        label: item.label,
        isHighRisk: item.isHighRisk,
        direction: item.direction as SignalDirection,
        description: item.description,
      },
    ]),
  );

  const validSignals = rawSignals.filter((signal) =>
    signalTypeByKey.has(signal.typeKey),
  );

  await prisma.projectSignal.deleteMany({
    where: {
      projectId,
      source: {
        not: "manual",
      },
      occurredAt: {
        gte: start,
        lt: end,
      },
    },
  });

  for (const signal of validSignals) {
    const signalType = signalTypeByKey.get(signal.typeKey);

    if (!signalType) continue;

    const direction = signalType.direction;
    const severity: SignalSeverity = signalType.isHighRisk ? "high" : "medium";

    await prisma.projectSignal.create({
      data: {
        projectId,
        source: meetings.length > 0 ? "meeting" : "chat",
        sourceId: null,
        typeKey: signalType.key,
        typeLabel: signalType.label,
        direction,
        severity,
        status: "active",
        title: signal.title?.trim() || signalType.label,
        text: signal.text?.trim() || signalType.description || signalType.label,
        confidence:
          typeof signal.confidence === "number" ? signal.confidence : null,
        occurredAt: start,
      },
    });
  }

  return validSignals;
}

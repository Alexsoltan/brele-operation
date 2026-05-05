import { prisma } from "@/lib/prisma";
import { getPromptConfig, renderPromptTemplate } from "@/lib/prompt-config";
import { recalculateProjectHealth } from "@/lib/recalculate-project-health";
import { extractSignalsFromMeeting } from "@/lib/signal-extractors";
import type {
  Meeting,
  Mood,
  Risk,
  SignalDirection,
  SignalSeverity,
  SignalType,
} from "@/lib/types";

type AnalysisSignal = {
  type: SignalType;
  title: string;
  text: string;
  direction: SignalDirection;
  severity: SignalSeverity;
};

type AnalysisResult = {
  summary: string;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  highlights: string[];
  signals: AnalysisSignal[];
  modelName?: string | null;
};

type AiProxyJsonResponse = {
  content?: string;
  modelName?: string;
};

const allowedSignalTypes = [
  "client_satisfaction",
  "client_dissatisfaction",
  "client_trust",
  "team_confidence",
  "team_demotivation",
  "deadline_risk",
  "scope_change",
  "quality_issue",
  "blocker",
  "budget_risk",
  "communication_gap",
  "decision_made",
  "escalation",
  "positive_feedback",
  "upsell_opportunity",
] as const;

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

function normalizeDirection(value: unknown): SignalDirection {
  if (value === "positive" || value === "negative" || value === "neutral") {
    return value;
  }

  return "neutral";
}

function normalizeSeverity(value: unknown): SignalSeverity {
  if (
    value === "info" ||
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  ) {
    return value;
  }

  return "low";
}

function isAllowedSignalType(value: unknown): value is SignalType {
  return (
    typeof value === "string" &&
    allowedSignalTypes.includes(value as (typeof allowedSignalTypes)[number])
  );
}

function normalizeHighlights(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function normalizeSignals(value: unknown): AnalysisSignal[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const raw = item as Record<string, unknown>;

      if (!isAllowedSignalType(raw.type)) return null;

      const text =
        typeof raw.text === "string" && raw.text.trim()
          ? raw.text.trim()
          : "";

      if (!text) return null;

      const title =
        typeof raw.title === "string" && raw.title.trim()
          ? raw.title.trim()
          : text.slice(0, 80);

      return {
        type: raw.type,
        title,
        text,
        direction: normalizeDirection(raw.direction),
        severity: normalizeSeverity(raw.severity),
      };
    })
    .filter((item): item is AnalysisSignal => Boolean(item))
    .slice(0, 3);
}

export async function analyzeMeetingText({
  text,
  workspaceId,
}: {
  text: string;
  workspaceId?: string | null;
}): Promise<AnalysisResult> {
  if (!text.trim()) {
    throw new Error("No text provided");
  }

  const promptConfig = await getPromptConfig(
    "meeting_analysis",
    workspaceId ?? null,
  );

  if (!promptConfig) {
    throw new Error("Prompt config not found");
  }

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
      model: promptConfig.modelName || "gpt-4o-mini",
      temperature: 0.1,
      system: promptConfig.systemPrompt,
      user: renderPromptTemplate(promptConfig.userPrompt, {
        text: text.slice(0, 20000),
      }),
    }),
  });

  const proxyData = (await response.json().catch(() => ({}))) as AiProxyJsonResponse;

  if (!response.ok) {
    throw new Error(
      `AI proxy error: ${JSON.stringify(proxyData).slice(0, 500)}`,
    );
  }

  let parsed: Partial<AnalysisResult> = {};

  try {
    parsed = JSON.parse(proxyData.content || "{}");
  } catch {
    parsed = {};
  }

  return {
    summary: parsed.summary || "Саммари не получено.",
    clientMood: normalizeMood(parsed.clientMood),
    teamMood: normalizeMood(parsed.teamMood),
    risk: normalizeRisk(parsed.risk),
    highlights: normalizeHighlights(parsed.highlights),
    signals: normalizeSignals(parsed.signals),
    modelName: proxyData.modelName || promptConfig.modelName,
  };
}

function toSignalMeeting(meeting: {
  id: string;
  projectId: string;
  meetingTypeId: string | null;
  title: string;
  date: Date;
  meetingType: string;
  hasClient: boolean;
  transcriptText: string | null;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  analysisStatus: "pending" | "analyzed" | "manual" | "error";
  modelName: string | null;
  analyzedAt: Date | null;
}): Meeting {
  return {
    ...meeting,
    date: meeting.date.toISOString(),
    analyzedAt: meeting.analyzedAt?.toISOString() ?? null,
  };
}

export async function analyzeAndSaveMeeting(meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      deletedAt: null,
    },
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  if (!meeting.transcriptText?.trim()) {
    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        summary:
          "AI-анализ не удалось выполнить: у встречи нет транскрибации.",
        highlights: [
          "У встречи нет текста транскрибации для автоматического анализа.",
        ],
        analysisStatus: "error",
        modelName: "",
        analyzedAt: null,
      },
      include: {
        project: true,
        type: true,
      },
    });

    await recalculateProjectHealth(meeting.projectId, meeting.workspaceId);

    return updated;
  }

  try {
    const result = await analyzeMeetingText({
      text: meeting.transcriptText,
      workspaceId: meeting.workspaceId,
    });

    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        summary: result.summary,
        highlights: result.highlights,
        clientMood: meeting.hasClient === false ? "neutral" : result.clientMood,
        teamMood: result.teamMood,
        risk: result.risk,
        analysisStatus: "analyzed",
        modelName: result.modelName ?? "AI",
        analyzedAt: new Date(),
      },
      include: {
        project: true,
        type: true,
      },
    });

    await prisma.projectSignal.deleteMany({
      where: {
        source: "meeting",
        sourceId: meeting.id,
      },
    });

    if (updated.highlights.length > 0) {
      await extractSignalsFromMeeting(toSignalMeeting(updated));
    }

    await recalculateProjectHealth(meeting.projectId, meeting.workspaceId);

    return updated;
  } catch (error) {
    console.error(`MEETING ANALYSIS FAILED ${meeting.id}:`, error);

    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        summary:
          "AI-анализ не удалось выполнить. Можно повторить анализ позже или обработать встречу вручную.",
        highlights: [
          "AI-анализ не завершился. Можно повторить позже или обработать встречу вручную.",
        ],
        clientMood: "neutral",
        teamMood: "neutral",
        risk: "medium",
        analysisStatus: "error",
        modelName: "",
        analyzedAt: null,
      },
      include: {
        project: true,
        type: true,
      },
    });

    await recalculateProjectHealth(meeting.projectId, meeting.workspaceId);

    return updated;
  }
}

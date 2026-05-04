import {
  createProjectSignal,
  getSignalDirectionFromText,
  getSignalSeverityFromText,
} from "@/lib/project-signals";
import type {
  Meeting,
  SignalCategory,
  SignalType,
} from "@/lib/types";

type ChatDailySummaryLike = {
  id: string;
  projectId: string;
  date: Date | string;
  summary: string;
  highlights: string[];
};

function detectSignalType(text: string): {
  type: SignalType;
  category: SignalCategory;
} {
  const t = text.toLowerCase();

  if (t.includes("клиент") && t.includes("недовол")) {
    return {
      type: "client_dissatisfaction",
      category: "client",
    };
  }

  if (t.includes("клиент") && (t.includes("довол") || t.includes("хорошо"))) {
    return {
      type: "client_satisfaction",
      category: "client",
    };
  }

  if (t.includes("срок") || t.includes("дедлайн")) {
    return {
      type: "deadline_risk",
      category: "delivery",
    };
  }

  if (t.includes("блокер")) {
    return {
      type: "blocker",
      category: "delivery",
    };
  }

  if (t.includes("объем") || t.includes("scope")) {
    return {
      type: "scope_change",
      category: "delivery",
    };
  }

  return {
    type: "communication_gap",
    category: "communication",
  };
}

function normalizeDate(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function buildSignalTitle(text: string) {
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

export async function extractSignalsFromMeeting(meeting: Meeting) {
  if (!meeting.highlights || meeting.highlights.length === 0) {
    return [];
  }

  const signals = [];

  for (const highlight of meeting.highlights) {
    const detected = detectSignalType(highlight);

    const signal = await createProjectSignal({
      projectId: meeting.projectId,
      source: "meeting",
      sourceId: meeting.id,

      type: detected.type,
      category: detected.category,
      direction: getSignalDirectionFromText(highlight),
      severity: getSignalSeverityFromText(highlight),

      title: buildSignalTitle(highlight),
      text: highlight,

      occurredAt: normalizeDate(meeting.date),
    });

    if (signal) {
      signals.push(signal);
    }
  }

  return signals;
}

export async function extractSignalsFromChatSummary(
  summary: ChatDailySummaryLike,
) {
  if (!summary.highlights || summary.highlights.length === 0) {
    return [];
  }

  const signals = [];

  for (const highlight of summary.highlights) {
    const detected = detectSignalType(highlight);

    const signal = await createProjectSignal({
      projectId: summary.projectId,
      source: "chat",
      sourceId: summary.id,

      type: detected.type,
      category: detected.category,
      direction: getSignalDirectionFromText(highlight),
      severity: getSignalSeverityFromText(highlight),

      title: buildSignalTitle(highlight),
      text: highlight,

      occurredAt: normalizeDate(summary.date),
    });

    if (signal) {
      signals.push(signal);
    }
  }

  return signals;
}
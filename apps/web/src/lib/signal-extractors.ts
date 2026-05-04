import {
  createProjectSignal,
  getSignalDirectionFromText,
  getSignalSeverityFromText,
} from "@/lib/project-signals";
import type {
  Meeting,
  SignalType,
} from "@/lib/types";

type ChatDailySummaryLike = {
  id: string;
  projectId: string;
  date: Date | string;
  summary: string;
  highlights: string[];
};

function detectSignalType(text: string): SignalType {
  const t = text.toLowerCase();

  if (t.includes("клиент") && t.includes("недовол")) {
    return "client_dissatisfaction";
  }

  if (t.includes("клиент") && (t.includes("довол") || t.includes("хорошо"))) {
    return "client_satisfaction";
  }

  if (t.includes("срок") || t.includes("дедлайн")) {
    return "deadline_risk";
  }

  if (t.includes("блокер")) {
    return "blocker";
  }

  if (t.includes("объем") || t.includes("scope")) {
    return "scope_change";
  }

  return "communication_gap";
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
    const typeKey = detectSignalType(highlight);

    const signal = await createProjectSignal({
      projectId: meeting.projectId,
      source: "meeting",
      sourceId: meeting.id,

      typeKey,
      typeLabel: null,
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
    const typeKey = detectSignalType(highlight);

    const signal = await createProjectSignal({
      projectId: summary.projectId,
      source: "chat",
      sourceId: summary.id,

      typeKey,
      typeLabel: null,
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

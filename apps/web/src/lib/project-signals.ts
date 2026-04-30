import type { Meeting } from "./types";

export type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
};

function detectSignalType(text: string): ProjectSignal["type"] {
  const lower = text.toLowerCase();

  if (
    lower.includes("недоволь") ||
    lower.includes("проблем") ||
    lower.includes("риск") ||
    lower.includes("демотив")
  ) {
    return "risk";
  }

  if (
    lower.includes("вопрос") ||
    lower.includes("сомнен") ||
    lower.includes("обсужд")
  ) {
    return "warning";
  }

  return "opportunity";
}

export function extractProjectSignals(
  meetings: Meeting[],
  limit = 5,
): ProjectSignal[] {
  const signals: ProjectSignal[] = [];

  meetings.slice(0, 10).forEach((meeting) => {
    meeting.highlights.forEach((highlight) => {
      signals.push({
        text: highlight,
        type: detectSignalType(highlight),
        date: meeting.date,
      });
    });
  });

  // приоритет: risk → warning → opportunity
  return signals
    .sort((a, b) => {
      const priority = { risk: 3, warning: 2, opportunity: 1 };
      return priority[b.type] - priority[a.type];
    })
    .slice(0, limit);
}
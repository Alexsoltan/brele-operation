import type { Meeting, Mood, Risk } from "@/lib/types";

export type ProjectHealthTrend = "up" | "down" | "flat";
export type ProjectHealthLabel = "stable" | "attention" | "critical";
export type ProjectHealthTone = "green" | "neutral" | "red";

export type ProjectHealthMeeting = Pick<
  Meeting,
  | "date"
  | "risk"
  | "clientMood"
  | "teamMood"
  | "hasClient"
  | "analysisStatus"
  | "highlights"
>;

export type ProjectHealthResult = {
  score: number;
  previousScore: number;
  delta: number;
  trend: ProjectHealthTrend;
  label: ProjectHealthLabel;
  tone: ProjectHealthTone;
  title: string;
  caption: string;
  summary: string;
};

const MAX_RELEVANT_MEETINGS = 10;

export function clampHealthScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function moodScore(value: Mood) {
  if (value === "good") return 3;
  if (value === "neutral") return 2;
  return 1;
}

export function riskScore(value: Risk) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

export function getTrend(
  current: number,
  previous: number,
): ProjectHealthTrend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export function meetingImpact(meeting: ProjectHealthMeeting) {
  let impact = 0;

  if (meeting.analysisStatus === "error") impact -= 3;

  if (meeting.risk === "high") impact -= 30;
  if (meeting.risk === "medium") impact -= 5;
  if (meeting.risk === "low") impact += 1;

  if (meeting.hasClient !== false) {
    if (meeting.clientMood === "bad") impact -= 22;
    if (meeting.clientMood === "neutral") impact += 0;
    if (meeting.clientMood === "good") impact += 5;
  }

  if (meeting.teamMood === "bad") impact -= 15;
  if (meeting.teamMood === "neutral") impact += 0;
  if (meeting.teamMood === "good") impact += 4;

  return impact;
}

export function sortMeetingsAsc<T extends { date: string | Date }>(
  meetings: T[],
) {
  return [...meetings].sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    return aTime - bTime;
  });
}

export function getRelevantMeetings<T extends { date: string | Date }>(
  meetings: T[],
  limit = MAX_RELEVANT_MEETINGS,
) {
  return sortMeetingsAsc(meetings).slice(-limit);
}

export function calculateRawProjectHealthScore(
  meetings: ProjectHealthMeeting[],
) {
  const relevantMeetings = getRelevantMeetings(meetings);
  let score = 100;

  relevantMeetings.forEach((meeting) => {
    score = clampHealthScore(score + meetingImpact(meeting));
  });

  return score;
}

export function getProjectHealthLabel(score: number): ProjectHealthLabel {
  if (score <= 45) return "critical";
  if (score <= 75) return "attention";
  return "stable";
}

export function getProjectHealthTone(score: number): ProjectHealthTone {
  const label = getProjectHealthLabel(score);

  if (label === "critical") return "red";
  if (label === "attention") return "neutral";
  return "green";
}

export function getProjectHealthTitle(score: number) {
  const label = getProjectHealthLabel(score);

  if (label === "critical") return "Есть риск";
  if (label === "attention") return "Нейтрально";
  return "Стабильно";
}

export function getProjectHealthCaption(score: number) {
  const label = getProjectHealthLabel(score);

  if (label === "critical") return "нужна реакция";
  if (label === "attention") return "есть сигналы просадки";
  return "проект под контролем";
}

export function buildProjectHealthSummary(
  meetings: ProjectHealthMeeting[],
  score: number,
  delta: number,
) {
  const latest = getRelevantMeetings(
    meetings.filter((meeting) => meeting.analysisStatus !== "pending"),
  ).reverse();

  const hasHighRisk = latest.some((meeting) => meeting.risk === "high");
  const hasMediumRisks =
    latest.filter((meeting) => meeting.risk === "medium").length >= 3;
  const hasBadClient = latest.some(
    (meeting) => meeting.hasClient !== false && meeting.clientMood === "bad",
  );
  const hasBadTeam = latest.some((meeting) => meeting.teamMood === "bad");
  const hasGoodClient = latest.some(
    (meeting) => meeting.hasClient !== false && meeting.clientMood === "good",
  );
  const hasGoodTeam = latest.some((meeting) => meeting.teamMood === "good");

  if (latest.length === 0) {
    return "Пока недостаточно проанализированных встреч, чтобы оценить динамику проекта.";
  }

  if (score <= 45) {
    return "Проект находится в зоне риска: последние встречи показывают критичные сигналы, которые требуют быстрой реакции.";
  }

  if (hasHighRisk || hasBadClient) {
    return "В проекте появились сильные негативные сигналы: стоит разобрать последние встречи и зафиксировать план действий.";
  }

  if (delta < -10 || hasBadTeam || hasMediumRisks) {
    return "Динамика проекта проседает: накопились сигналы, которые требуют внимания менеджера.";
  }

  if (delta > 8 || (hasGoodClient && hasGoodTeam)) {
    return "Динамика проекта улучшается: последние встречи выглядят стабильнее, риски снижаются.";
  }

  return "Проект выглядит стабильно: критичных сигналов нет, но стоит продолжать следить за рисками и настроением команды.";
}

export function calculateProjectHealth(
  meetings: ProjectHealthMeeting[],
): ProjectHealthResult {
  const relevantMeetings = getRelevantMeetings(meetings);
  const score = calculateRawProjectHealthScore(relevantMeetings);
  const previousScore =
    relevantMeetings.length > 1
      ? calculateRawProjectHealthScore(relevantMeetings.slice(0, -1))
      : 100;

  const delta = score - previousScore;
  const trend = getTrend(score, previousScore);

  return {
    score,
    previousScore,
    delta,
    trend,
    label: getProjectHealthLabel(score),
    tone: getProjectHealthTone(score),
    title: getProjectHealthTitle(score),
    caption: getProjectHealthCaption(score),
    summary: buildProjectHealthSummary(relevantMeetings, score, delta),
  };
}
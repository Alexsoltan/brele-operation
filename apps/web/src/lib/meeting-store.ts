import type { Mood, Risk } from "@/lib/mock-data";

export type MeetingAnalysisStatus = "pending" | "analyzed" | "manual" | "error";

export type Meeting = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  meetingType: string;
  transcriptText?: string;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  analysisStatus: MeetingAnalysisStatus;
  modelName?: string;
  analyzedAt?: string;
};

const STORAGE_KEY = "brele-meetings";

const seedMeetings: Meeting[] = [
  {
    id: "meeting-1",
    projectId: "alfa-mobile-app",
    title: "Демо",
    date: "2026-04-24",
    meetingType: "demo",
    clientMood: "good",
    teamMood: "good",
    risk: "low",
    analysisStatus: "analyzed",
    modelName: "seed",
    analyzedAt: "2026-04-24T12:00:00.000Z",
    summary:
      "Клиент в целом принял направление дизайна, но попросил отдельно уточнить сроки по мобильной версии и порядок согласования следующих экранов.",
    highlights: [
      "Клиент принял направление дизайна.",
      "Нужно уточнить сроки мобильной версии.",
      "Следующий шаг — согласование следующих экранов.",
    ],
    transcriptText: "",
  },
];

function normalizeMeeting(meeting: Partial<Meeting>): Meeting {
  return {
    id: meeting.id ?? `meeting-${Date.now()}`,
    projectId: meeting.projectId ?? "unknown",
    title: meeting.title ?? meetingTypeLabel(meeting.meetingType ?? "sync"),
    date: meeting.date ?? new Date().toISOString().slice(0, 10),
    meetingType: meeting.meetingType ?? "sync",
    transcriptText: meeting.transcriptText ?? "",
    summary: meeting.summary ?? "AI-анализ ещё не завершён.",
    highlights: Array.isArray(meeting.highlights) ? meeting.highlights : [],
    clientMood: meeting.clientMood ?? "neutral",
    teamMood: meeting.teamMood ?? "neutral",
    risk: meeting.risk ?? "low",
    analysisStatus: meeting.analysisStatus ?? "analyzed",
    modelName: meeting.modelName ?? "",
    analyzedAt: meeting.analyzedAt ?? "",
  };
}

export function getMeetings(): Meeting[] {
  if (typeof window === "undefined") return seedMeetings;

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMeetings));
    return seedMeetings;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<Meeting>[];
    const normalized = parsed.map(normalizeMeeting);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    return normalized;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMeetings));
    return seedMeetings;
  }
}

export function getMeetingById(meetingId: string): Meeting | undefined {
  return getMeetings().find((meeting) => meeting.id === meetingId);
}

export function getProjectMeetings(projectId: string): Meeting[] {
  return getMeetings()
    .filter((meeting) => meeting.projectId === projectId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function createMeeting(input: Omit<Meeting, "id">): Meeting {
  const meeting: Meeting = {
    id: `meeting-${Date.now()}`,
    ...input,
  };

  const nextMeetings = [meeting, ...getMeetings()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMeetings));

  return meeting;
}

export function updateMeeting(
  meetingId: string,
  patch: Partial<Meeting>,
): Meeting[] {
  const nextMeetings = getMeetings().map((meeting) =>
    meeting.id === meetingId
      ? normalizeMeeting({
          ...meeting,
          ...patch,
          id: meeting.id,
        })
      : meeting,
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMeetings));

  return nextMeetings;
}

export function formatMeetingDate(date: string) {
  if (!date) return "Без даты";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function meetingTypeLabel(value: string) {
  const labels: Record<string, string> = {
    sync: "Синк",
    demo: "Демо",
    planning: "Планирование",
    acceptance: "Приёмка",
    risk: "Разбор рисков",
  };

  return labels[value] ?? value;
}
import type { Mood, Risk } from "@/lib/mock-data";

export type MeetingAnalysisStatus = "manual" | "analyzed";

export type Meeting = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  meetingType: string;
  transcriptText?: string;
  summary: string;
  problems?: string;
  nextActions?: string;
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
    title: "Демо дизайна клиенту",
    date: "2026-04-24",
    meetingType: "Демо клиенту",
    clientMood: "neutral",
    teamMood: "good",
    risk: "low",
    analysisStatus: "analyzed",
    modelName: "mock-ai",
    analyzedAt: "2026-04-24T12:00:00.000Z",
    summary:
      "Клиент в целом принял направление дизайна, но попросил отдельно уточнить сроки по мобильной версии и порядок согласования следующих экранов.",
    problems:
      "Не до конца зафиксированы сроки мобильной версии и порядок финального согласования экранов.",
    nextActions:
      "Отправить клиенту короткое summary с датами, ответственными и следующим контрольным синком.",
  },
  {
    id: "meeting-2",
    projectId: "alfa-mobile-app",
    title: "Синк с клиентом",
    date: "2026-04-17",
    meetingType: "Синк с клиентом",
    clientMood: "bad",
    teamMood: "neutral",
    risk: "medium",
    analysisStatus: "analyzed",
    modelName: "mock-ai",
    analyzedAt: "2026-04-17T12:00:00.000Z",
    summary:
      "Клиент выразил недовольство темпом согласований и попросил больше прозрачности по срокам. Команда объяснила причины задержек, но не зафиксировала новый план.",
    problems:
      "Клиенту не хватает прозрачности по срокам и понятного плана дальнейших действий.",
    nextActions:
      "Зафиксировать новый план работ, отправить его клиенту и отдельно подтвердить даты ближайших результатов.",
  },
];

export function getMeetings(): Meeting[] {
  if (typeof window === "undefined") return seedMeetings;

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMeetings));
    return seedMeetings;
  }

  try {
    return JSON.parse(saved) as Meeting[];
  } catch {
    return seedMeetings;
  }
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
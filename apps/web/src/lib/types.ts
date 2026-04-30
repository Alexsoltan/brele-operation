export type Mood = "good" | "neutral" | "bad";
export type Risk = "low" | "medium" | "high";
export type ProjectStatus = "active" | "hold" | "archived";
export type MeetingAnalysisStatus = "pending" | "analyzed" | "manual" | "error";

export type ProjectHealthTrend = "up" | "down" | "flat";
export type ProjectHealthLabel = "stable" | "attention" | "critical";

export type Project = {
  id: string;
  slug?: string;
  name: string;
  client?: string | null;
  status?: ProjectStatus;
  clientMood?: Mood;
  teamMood?: Mood;
  risk?: Risk;
  healthScore?: number;
  healthTrend?: ProjectHealthTrend;
  healthLabel?: ProjectHealthLabel;
  healthSummary?: string | null;
  healthCalculatedAt?: string | null;
};

export type Meeting = {
  id: string;
  projectId: string;
  meetingTypeId?: string | null;
  title: string;
  date: string;
  meetingType: string;
  hasClient?: boolean;
  transcriptText?: string | null;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  analysisStatus: MeetingAnalysisStatus;
  modelName?: string | null;
  analyzedAt?: string | null;
  project?: Project;
};

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
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

export type SignalSource = "meeting" | "chat" | "manual";

export type SignalCategory =
  | "client"
  | "team"
  | "delivery"
  | "business"
  | "communication"
  | "process"
  | "opportunity";

export type SignalType =
  | "client_satisfaction"
  | "client_dissatisfaction"
  | "client_trust"
  | "team_confidence"
  | "team_demotivation"
  | "deadline_risk"
  | "scope_change"
  | "quality_issue"
  | "blocker"
  | "budget_risk"
  | "communication_gap"
  | "decision_made"
  | "escalation"
  | "positive_feedback"
  | "upsell_opportunity";

export type SignalDirection = "positive" | "negative" | "neutral";

export type SignalSeverity = "info" | "low" | "medium" | "high" | "critical";

export type SignalStatus = "active" | "resolved" | "dismissed";

export type ProjectSignal = {
  id: string;
  projectId: string;

  source: SignalSource;
  sourceId?: string | null;

  category: SignalCategory;
  type: SignalType;
  direction: SignalDirection;
  severity: SignalSeverity;
  status: SignalStatus;

  title: string;
  text: string;

  confidence?: number | null;

  occurredAt: string;

  createdAt: string;
  updatedAt: string;
};

export type PromptConfigKey =
  | "meeting_analysis"
  | "chat_daily_summary"
  | "signal_extraction_from_meeting"
  | "signal_extraction_from_chat"
  | "project_health_summary";

export type PromptConfig = {
  id: string;
  workspaceId?: string | null;

  key: PromptConfigKey;
  label: string;
  description?: string | null;
  systemPrompt: string;
  userPrompt: string;
  modelName?: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export type SignalWeightConfig = {
  id: string;
  workspaceId?: string | null;

  type: SignalType;

  weight: number;
  clientMoodImpact: number;
  teamMoodImpact: number;

  label?: string | null;
  isActive: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};

export type CreateProjectSignalInput = {
  projectId: string;

  source: SignalSource;
  sourceId?: string | null;

  category: SignalCategory;
  type: SignalType;
  direction: SignalDirection;
  severity: SignalSeverity;
  status?: SignalStatus;

  title: string;
  text: string;

  confidence?: number | null;

  occurredAt: string;
};
export type ProjectStatus = "active" | "archived";
export type Mood = "good" | "neutral" | "bad";
export type Risk = "low" | "medium" | "high";

export const projects = [
  {
    id: "alfa-mobile-app",
    name: "Альфа-Банк — Mobile App",
    clientName: "Альфа-Банк",
    status: "active" as ProjectStatus,
    clientMood: "good" as Mood,
    teamMood: "good" as Mood,
    risk: "low" as Risk,
    lastMeetingAt: "24 Apr 2026",
  },
  {
    id: "beta-crm",
    name: "Beta Group — CRM",
    clientName: "Beta Group",
    status: "active" as ProjectStatus,
    clientMood: "neutral" as Mood,
    teamMood: "neutral" as Mood,
    risk: "medium" as Risk,
    lastMeetingAt: "18 Apr 2026",
  },
  {
    id: "gamma-website",
    name: "Gamma — Website",
    clientName: "Gamma",
    status: "active" as ProjectStatus,
    clientMood: "bad" as Mood,
    teamMood: "neutral" as Mood,
    risk: "high" as Risk,
    lastMeetingAt: "11 Apr 2026",
  },
];
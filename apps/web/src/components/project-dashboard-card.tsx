import Link from "next/link";
import {
  Activity,
  CalendarDays,
  ShieldAlert,
  Smile,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  getProjectHealthCaption,
  getProjectHealthTitle,
  getTrend,
  moodScore,
  riskScore,
  type ProjectHealthTone,
  type ProjectHealthTrend,
} from "@/lib/project-health";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";

type Trend = ProjectHealthTrend;
type SignalKind = "mood" | "risk";

function latestClientMood(project: Project, meetings: Meeting[]) {
  const latestClientMeeting = meetings.find(
    (meeting) => meeting.hasClient !== false,
  );

  return latestClientMeeting?.clientMood ?? project.clientMood ?? "neutral";
}

function latestTeamMood(project: Project, meetings: Meeting[]) {
  return meetings[0]?.teamMood ?? project.teamMood ?? "neutral";
}

function latestRisk(project: Project, meetings: Meeting[]) {
  return meetings[0]?.risk ?? project.risk ?? "low";
}

function getMeetingTrend(
  meetings: Meeting[],
  field: "clientMood" | "teamMood" | "risk",
): Trend {
  const current = meetings[0];

  if (!current) return "flat";

  const previous = meetings[1];

  if (field === "risk") {
    return getTrend(
      riskScore(current.risk),
      riskScore(previous?.risk ?? "medium"),
    );
  }

  return getTrend(
    moodScore(current[field]),
    moodScore(previous?.[field] ?? "neutral"),
  );
}

function latestMeetingLabel(meetings: Meeting[]) {
  return meetings[0]?.date ?? "Нет встреч";
}

function formatDate(value: string) {
  if (!value || value === "Нет встреч") return "Нет встреч";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getHealthTone(score: number): ProjectHealthTone {
  if (score <= 69) return "red";
  if (score <= 79) return "neutral";
  return "green";
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <TrendingUp size={14} strokeWidth={2.2} />;
  if (trend === "down") return <TrendingDown size={14} strokeWidth={2.2} />;
  return <Activity size={14} strokeWidth={2.2} />;
}

function ProjectStateTrendIcon({ trend }: { trend: Trend }) {
  const className =
    trend === "up"
      ? "text-[#d9ff3f]"
      : trend === "down"
        ? "text-[#ffc0c0]"
        : "text-white/45";

  if (trend === "up") {
    return <TrendingUp size={24} strokeWidth={2.4} className={className} />;
  }

  if (trend === "down") {
    return <TrendingDown size={24} strokeWidth={2.4} className={className} />;
  }

  return <Activity size={24} strokeWidth={2.4} className={className} />;
}

function SignalChip({
  label,
  trend,
  kind,
  icon: Icon,
}: {
  label: string;
  trend: Trend;
  kind: SignalKind;
  icon: typeof Smile;
}) {
  const isPositive = kind === "mood" ? trend === "up" : trend === "down";
  const isNegative = kind === "mood" ? trend === "down" : trend === "up";

  const tone = isPositive
    ? "border-[#d9ff3f]/30 bg-[#d9ff3f]/10 text-[#d9ff3f]"
    : isNegative
      ? "border-[#ffc0c0]/30 bg-[#ffc0c0]/10 text-[#ffc0c0]"
      : "border-white/10 bg-white/8 text-white/55";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
      ].join(" ")}
    >
      <Icon size={13} />
      {label}
      <TrendIcon trend={trend} />
    </span>
  );
}

export function ProjectDashboardCard({
  project,
  meetings,
}: {
  project: Project;
  meetings: Meeting[];
}) {
  const clientMood: Mood = latestClientMood(project, meetings);
  const teamMood: Mood = latestTeamMood(project, meetings);
  const risk: Risk = latestRisk(project, meetings);

  const healthScore = project.healthScore ?? 100;
  const healthTrend = project.healthTrend ?? "flat";
  const healthTitle = getProjectHealthTitle(healthScore);
  const healthCaption = getProjectHealthCaption(healthScore);

  const clientTrend = getMeetingTrend(
    meetings.filter((meeting) => meeting.hasClient !== false),
    "clientMood",
  );
  const teamTrend = getMeetingTrend(meetings, "teamMood");
  const riskTrend = getMeetingTrend(meetings, "risk");

  const tone = getHealthTone(healthScore);
  const latestMeeting = latestMeetingLabel(meetings);

  const glow =
    tone === "green"
      ? "from-[#c9f5d3]/45 via-[#9ee6b2]/18 to-transparent"
      : tone === "red"
        ? "from-[#ffc0c0]/45 via-[#ff9c9c]/18 to-transparent"
        : "from-[#ffe98a]/45 via-[#ffd36b]/18 to-transparent";

  const dot =
    tone === "green"
      ? "bg-[#9ee6b2] shadow-[0_0_24px_rgba(158,230,178,0.7)]"
      : tone === "red"
        ? "bg-[#ff9c9c] shadow-[0_0_24px_rgba(255,156,156,0.7)]"
        : "bg-[#ffe98a] shadow-[0_0_24px_rgba(255,233,138,0.7)]";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative block min-h-[260px] overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(0,0,0,0.16)]"
    >
      <div
        className={[
          "pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-gradient-to-br blur-3xl transition group-hover:opacity-90",
          glow,
        ].join(" ")}
      />

      <div
        className={[
          "pointer-events-none absolute -right-20 bottom-[-100px] h-72 w-72 rounded-full bg-gradient-to-tl blur-3xl transition group-hover:opacity-90",
          glow,
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-xl font-semibold tracking-[-0.03em]">
            {project.name}
          </h2>

          <div className="mt-1 text-xs text-white/35">
            ProjectHealth: {healthScore}
          </div>
        </div>

        <span className={["h-3.5 w-3.5 shrink-0 rounded-full", dot].join(" ")} />
      </div>

      <div className="relative mt-12">
        <div className="flex items-center gap-3">
          <div className="font-heading text-[34px] font-semibold leading-none tracking-[-0.06em]">
            {healthTitle}
          </div>

          <ProjectStateTrendIcon trend={healthTrend} />
        </div>

        <div className="mt-3 text-sm text-white/45">{healthCaption}</div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-2">
        <SignalChip
          label="Клиент"
          trend={clientTrend}
          kind="mood"
          icon={Smile}
        />

        <SignalChip
          label="Команда"
          trend={teamTrend}
          kind="mood"
          icon={Users}
        />

        <SignalChip
          label="Риск"
          trend={riskTrend}
          kind="risk"
          icon={ShieldAlert}
        />
      </div>

      <div className="relative mt-6 flex items-center gap-2 text-xs text-white/35">
        <CalendarDays size={14} />
        Последняя встреча: {formatDate(latestMeeting)}
      </div>
    </Link>
  );
}
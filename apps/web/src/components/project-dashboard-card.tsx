import Link from "next/link";
import {
  CalendarDays,
  Activity,
  Minus,
  ShieldAlert,
  Smile,
  TrendingDown,
  TrendingUp,
  Zap,
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
  if (score <= 45) return "red";
  if (score <= 75) return "neutral";
  return "green";
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <TrendingUp size={15} strokeWidth={2.2} />;
  }

  if (trend === "down") {
    return <TrendingDown size={15} strokeWidth={2.2} />;
  }

  return <Activity size={15} strokeWidth={2.2} />;
}

function ProjectStateTrendIcon({ trend }: { trend: Trend }) {
  const className =
    trend === "up"
      ? "text-green-200 drop-shadow-[0_0_16px_rgba(134,239,172,0.5)]"
      : trend === "down"
        ? "text-red-200 drop-shadow-[0_0_16px_rgba(252,165,165,0.5)]"
        : "text-white/45";

  if (trend === "up") {
    return <TrendingUp size={28} strokeWidth={2.4} className={className} />;
  }

  if (trend === "down") {
    return <TrendingDown size={28} strokeWidth={2.4} className={className} />;
  }

  return <Activity size={28} strokeWidth={2.4} className={className} />;
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
    ? "bg-green-300/15 text-green-200 ring-green-300/25"
    : isNegative
      ? "bg-red-300/15 text-red-200 ring-red-300/25"
      : "bg-white/10 text-white/55 ring-white/10";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
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
      ? "from-green-300/70 via-green-300/25 to-transparent"
      : tone === "red"
        ? "from-red-300/70 via-red-300/25 to-transparent"
        : "from-white/20 via-white/10 to-transparent";

  const dot =
    tone === "green"
      ? "bg-green-300 shadow-[0_0_24px_rgba(134,239,172,0.75)]"
      : tone === "red"
        ? "bg-red-300 shadow-[0_0_24px_rgba(252,165,165,0.75)]"
        : "bg-gray-300 shadow-[0_0_18px_rgba(209,213,219,0.45)]";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="relative block overflow-hidden rounded-[32px] bg-[#20201f] p-6 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={[
          "pointer-events-none absolute -left-20 -top-24 h-60 w-60 rounded-full bg-gradient-to-br blur-2xl",
          glow,
        ].join(" ")}
      />

      <div
        className={[
          "pointer-events-none absolute -right-16 bottom-[-88px] h-60 w-60 rounded-full bg-gradient-to-tl blur-2xl",
          glow,
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <h2 className="truncate font-heading text-xl font-semibold tracking-[-0.03em]">
          {project.name}
        </h2>

        <span className={["h-3.5 w-3.5 rounded-full", dot].join(" ")} />
      </div>

      <div className="relative mt-12">
        <div className="flex items-center gap-3">
          <div className="font-heading text-[32px] font-semibold leading-none tracking-[-0.06em]">
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

      <div className="relative mt-6 flex items-center gap-2 text-xs text-white/40">
        <CalendarDays size={14} />
        Последняя встреча: {formatDate(latestMeeting)}
      </div>
    </Link>
  );
}
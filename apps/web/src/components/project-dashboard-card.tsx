import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Smile,
  Users,
} from "lucide-react";

import {
  getProjectHealthCaption,
  getProjectHealthTitle,
  getTrend,
  meetingImpact,
  moodScore,
  type ProjectHealthTone,
  type ProjectHealthTrend,
} from "@/lib/project-health";
import type { Meeting, Mood, Project } from "@/lib/types";

type Trend = ProjectHealthTrend;

function latestClientMood(project: Project, meetings: Meeting[]) {
  const latestClientMeeting = meetings.find(
    (meeting) => meeting.hasClient !== false,
  );

  return latestClientMeeting?.clientMood ?? project.clientMood ?? "neutral";
}

function latestTeamMood(project: Project, meetings: Meeting[]) {
  return meetings[0]?.teamMood ?? project.teamMood ?? "neutral";
}

function getMeetingTrend(
  meetings: Meeting[],
  field: "clientMood" | "teamMood",
): Trend {
  const current = meetings[0];

  if (!current) return "flat";

  const previous = meetings[1];

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

function getHealthDelta(project: Project, meetings: Meeting[]) {
  const currentScore = project.healthScore ?? 100;
  const latestMeeting = meetings[0];

  if (!latestMeeting) return 0;

  const impact = meetingImpact({
    date: latestMeeting.date,
    risk: latestMeeting.risk,
    clientMood: latestMeeting.clientMood,
    teamMood: latestMeeting.teamMood,
    hasClient: latestMeeting.hasClient,
    analysisStatus: latestMeeting.analysisStatus,
    highlights: latestMeeting.highlights,
  });

  return currentScore - Math.max(0, Math.min(100, currentScore - impact));
}

function healthCardTone(score: number) {
  if (score >= 80) {
    return {
      panel:
        "bg-gradient-to-br from-[#c9f5d3] via-[#b7efc4] to-[#9ee6b2] text-black",
      bubble: "bg-black/10 text-black",
      dot: "bg-[#9ee6b2] shadow-[0_0_24px_rgba(158,230,178,0.65)]",
      glow: "from-[#c9f5d3]/35 via-[#9ee6b2]/16 to-transparent",
    };
  }

  if (score >= 70) {
    return {
      panel:
        "bg-gradient-to-br from-[#f6ff8f] via-[#ffe98a] to-[#ffd36b] text-black",
      bubble: "bg-black/10 text-black",
      dot: "bg-[#ffe98a] shadow-[0_0_24px_rgba(255,233,138,0.65)]",
      glow: "from-[#ffe98a]/34 via-[#ffd36b]/16 to-transparent",
    };
  }

  return {
    panel:
      "bg-gradient-to-br from-[#ffd7d7] via-[#ffc0c0] to-[#ff9c9c] text-[#7f1d1d]",
    bubble: "bg-red-900/10 text-[#7f1d1d]",
    dot: "bg-[#ff9c9c] shadow-[0_0_24px_rgba(255,156,156,0.65)]",
    glow: "from-[#ffc0c0]/34 via-[#ff9c9c]/16 to-transparent",
  };
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) return <ArrowUpRight size={15} strokeWidth={2.3} />;
  if (delta < 0) return <ArrowDownRight size={15} strokeWidth={2.3} />;
  return <Activity size={15} strokeWidth={2.3} />;
}

function SignalChip({
  label,
  trend,
  icon: Icon,
}: {
  label: string;
  trend: Trend;
  icon: typeof Smile;
}) {
  const tone =
    trend === "up"
      ? "border-[#b7efc4]/35 bg-[#c9f5d3]/10 text-[#c9f5d3]"
      : trend === "down"
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
      <TrendIcon delta={trend === "up" ? 1 : trend === "down" ? -1 : 0} />
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

  const healthScore = project.healthScore ?? 100;
  const healthTitle = getProjectHealthTitle(healthScore);
  const healthCaption = getProjectHealthCaption(healthScore);
  const healthDelta = getHealthDelta(project, meetings);
  const tone = getHealthTone(healthScore);
  const cardTone = healthCardTone(healthScore);

  const clientTrend = getMeetingTrend(
    meetings.filter((meeting) => meeting.hasClient !== false),
    "clientMood",
  );
  const teamTrend = getMeetingTrend(meetings, "teamMood");

  const latestMeeting = latestMeetingLabel(meetings);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative block min-h-[280px] overflow-hidden rounded-[34px] bg-[#1f1f1f] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(0,0,0,0.16)]"
    >
      <div
        className={[
          "pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br blur-3xl transition",
          cardTone.glow,
        ].join(" ")}
      />

      <div
        className={[
          "pointer-events-none absolute -right-24 bottom-[-120px] h-80 w-80 rounded-full bg-gradient-to-tl blur-3xl transition",
          cardTone.glow,
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <h2 className="truncate font-heading text-3xl font-semibold tracking-[-0.03em]">
          {project.name}
        </h2>

      </div>

      <div
        className={[
          "relative mt-7 inline-block max-w-[240px] overflow-hidden rounded-[24px] px-4 py-3",
          cardTone.panel,
        ].join(" ")}
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/35 blur-3xl" />

        <div className="relative flex items-start gap-2">
          <div className="font-heading text-[44px] font-semibold leading-none tracking-[-0.08em]">
            {healthScore}
          </div>

          <div
            className={[
              "mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              cardTone.bubble,
            ].join(" ")}
          >
            <TrendIcon delta={healthDelta} />
            {healthDelta > 0 ? `+${healthDelta}` : healthDelta}
          </div>
        </div>

        <div className="relative mt-2 text-base font-semibold">
          {healthTitle}
        </div>
      </div>

      <div className="relative mt-4 text-sm leading-5 text-white/45">
        {healthCaption}
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <SignalChip label="Клиент" trend={clientTrend} icon={Smile} />
        <SignalChip label="Команда" trend={teamTrend} icon={Users} />
      </div>

      <div className="relative mt-5 flex items-center gap-2 text-xs text-white/35">
        <CalendarDays size={14} />
        Последняя встреча: {formatDate(latestMeeting)}
      </div>
    </Link>
  );
}

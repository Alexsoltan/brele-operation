"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Minus,
  ShieldAlert,
  Smile,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageTitle } from "@/components/page-title";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";

type Trend = "up" | "down" | "flat";
type SignalKind = "mood" | "risk";
type ProjectTone = "green" | "red" | "neutral";

function moodScore(value: Mood) {
  if (value === "good") return 3;
  if (value === "neutral") return 2;
  return 1;
}

function riskScore(value: Risk) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTrend(current: number, previous: number): Trend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function meetingImpact(meeting: Meeting) {
  let impact = 0;

  if (meeting.analysisStatus === "error") impact -= 10;

  if (meeting.risk === "high") impact -= 35;
  if (meeting.risk === "medium") impact -= 18;
  if (meeting.risk === "low") impact += 2;

  if (meeting.hasClient !== false) {
    if (meeting.clientMood === "bad") impact -= 25;
    if (meeting.clientMood === "neutral") impact -= 6;
    if (meeting.clientMood === "good") impact += 6;
  }

  if (meeting.teamMood === "bad") impact -= 20;
  if (meeting.teamMood === "neutral") impact -= 4;
  if (meeting.teamMood === "good") impact += 5;

  return impact;
}

function projectHealthScore(meetings: Meeting[]) {
  const sortedMeetings = [...meetings].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  let score = 100;

  sortedMeetings.forEach((meeting) => {
    score = clamp(score + meetingImpact(meeting));
  });

  return score;
}

function previousProjectHealthScore(meetings: Meeting[]) {
  if (meetings.length <= 1) return 100;

  const sortedMeetings = [...meetings].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return projectHealthScore(sortedMeetings.slice(0, -1));
}

function projectHealthTrend(meetings: Meeting[]): Trend {
  return getTrend(projectHealthScore(meetings), previousProjectHealthScore(meetings));
}

function getProjectTrend(
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

function projectToneByHealth(score: number): ProjectTone {
  if (score <= 45) return "red";
  if (score <= 75) return "neutral";
  return "green";
}

function projectStateLabelByHealth(score: number) {
  if (score <= 45) return "Есть риск";
  if (score <= 75) return "Нейтрально";
  return "Стабильно";
}

function projectStateCaptionByHealth(score: number) {
  if (score <= 45) return "нужна реакция";
  if (score <= 75) return "есть сигналы просадки";
  return "проект под контролем";
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <TrendingUp size={15} strokeWidth={2.2} />;
  }

  if (trend === "down") {
    return <TrendingDown size={15} strokeWidth={2.2} />;
  }

  return <Minus size={15} strokeWidth={2.2} />;
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

  return <Minus size={28} strokeWidth={2.4} className={className} />;
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

function ProjectDashboardCard({
  project,
  meetings,
}: {
  project: Project;
  meetings: Meeting[];
}) {
  const clientMood = latestClientMood(project, meetings);
  const teamMood = latestTeamMood(project, meetings);
  const risk = latestRisk(project, meetings);

  const healthScore = projectHealthScore(meetings);
  const healthTrend = projectHealthTrend(meetings);

  const clientTrend = getProjectTrend(
    meetings.filter((meeting) => meeting.hasClient !== false),
    "clientMood",
  );
  const teamTrend = getProjectTrend(meetings, "teamMood");
  const riskTrend = getProjectTrend(meetings, "risk");

  const tone = projectToneByHealth(healthScore);
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
            {projectStateLabelByHealth(healthScore)}
          </div>

          <ProjectStateTrendIcon trend={healthTrend} />
        </div>

        <div className="mt-3 text-sm text-white/45">
          {projectStateCaptionByHealth(healthScore)}
        </div>
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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetingsByProject, setMeetingsByProject] = useState<
    Record<string, Meeting[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projectsResponse, meetingsResponse] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/meetings"),
        ]);

        const projectsData = (await projectsResponse.json()) as Project[];
        const meetingsData = (await meetingsResponse.json()) as Meeting[];

        const activeProjects = projectsData.filter(
          (project) => project.status === "active",
        );

        const groupedMeetings = activeProjects.reduce<Record<string, Meeting[]>>(
          (acc, project) => {
            acc[project.id] = meetingsData
              .filter((meeting) => meeting.projectId === project.id)
              .sort((a, b) => b.date.localeCompare(a.date));

            return acc;
          },
          {},
        );

        setProjects(activeProjects);
        setMeetingsByProject(groupedMeetings);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aMeetings = meetingsByProject[a.id] ?? [];
      const bMeetings = meetingsByProject[b.id] ?? [];

      return projectHealthScore(aMeetings) - projectHealthScore(bMeetings);
    });
  }, [meetingsByProject, projects]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Загрузка дашборда...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <PageTitle>Состояние проектов</PageTitle>

        <p className="mt-1 text-sm text-gray-500">
          Обзор всех активных проектов и здоровья проектов
        </p>
      </header>

      {sortedProjects.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
          Активных проектов пока нет.
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-4">
          {sortedProjects.map((project) => (
            <ProjectDashboardCard
              key={project.id}
              project={project}
              meetings={meetingsByProject[project.id] ?? []}
            />
          ))}
        </section>
      )}
    </div>
  );
}
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

function getTrend(current: number, previous: number): Trend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
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
  return meetings[0]?.clientMood ?? project.clientMood ?? "neutral";
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

function projectTone(clientMood: Mood, teamMood: Mood, risk: Risk): ProjectTone {
  if (clientMood === "bad" || teamMood === "bad" || risk === "high") {
    return "red";
  }

  if (clientMood === "good" && teamMood === "good" && risk === "low") {
    return "green";
  }

  return "neutral";
}

function projectStateLabel(clientMood: Mood, teamMood: Mood, risk: Risk) {
  if (clientMood === "bad" || teamMood === "bad" || risk === "high") {
    return "Есть риск";
  }

  if (clientMood === "good" && teamMood === "good" && risk === "low") {
    return "Стабильно";
  }

  return "Нейтрально";
}

function projectStateCaption(clientMood: Mood, teamMood: Mood, risk: Risk) {
  if (clientMood === "bad" || teamMood === "bad" || risk === "high") {
    return "нужна реакция";
  }

  if (clientMood === "good" && teamMood === "good" && risk === "low") {
    return "проект под контролем";
  }

  return "без явного сигнала";
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

  const clientTrend = getProjectTrend(meetings, "clientMood");
  const teamTrend = getProjectTrend(meetings, "teamMood");
  const riskTrend = getProjectTrend(meetings, "risk");

  const tone = projectTone(clientMood, teamMood, risk);
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
        <div className="font-heading text-[32px] font-semibold leading-none tracking-[-0.06em]">
          {projectStateLabel(clientMood, teamMood, risk)}
        </div>

        <div className="mt-3 text-sm text-white/45">
          {projectStateCaption(clientMood, teamMood, risk)}
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

      return (
        moodScore(latestClientMood(a, aMeetings)) -
        moodScore(latestClientMood(b, bMeetings))
      );
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
          Обзор всех активных проектов и настроения клиентов
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
"use client";

import Link from "next/link";
import { PageTitle } from "@/components/page-title";
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

import type { Meeting, Mood, Project, Risk } from "@/lib/types";

type Trend = "up" | "down" | "flat";

function moodScore(value: Mood) {
  if (value === "good") return 3;
  if (value === "neutral") return 2;
  return 1;
}

function riskScore(value: Risk) {
  if (value === "low") return 3;
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
  if (meetings.length < 2) return "flat";

  const current = meetings[0];
  const previous = meetings[1];

  if (field === "risk") {
    return getTrend(riskScore(current.risk), riskScore(previous.risk));
  }

  return getTrend(moodScore(current[field]), moodScore(previous[field]));
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <TrendingUp size={14} className="text-green-600" />;
  }

  if (trend === "down") {
    return <TrendingDown size={14} className="text-red-600" />;
  }

  return <Minus size={14} className="text-gray-400" />;
}

function SignalItem({
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
      ? "border-green-200 bg-green-50 text-green-700"
      : trend === "down"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-gray-200 bg-gray-100 text-gray-500";

  const iconTone =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-red-500"
        : "text-gray-400";

  return (
    <div
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tone,
      ].join(" ")}
    >
      <Icon size={13} className={iconTone} />
      <span>{label}</span>
      <TrendIcon trend={trend} />
    </div>
  );
}

function MiniGauge({ value }: { value: Mood }) {
  const rotation = value === "good" ? 48 : value === "bad" ? -48 : 0;

  return (
    <div className="relative h-[74px] w-[116px] overflow-hidden">
      <div
        className="absolute left-0 top-0 h-[116px] w-[116px] rounded-full"
        style={{
          background:
            "conic-gradient(from 270deg, #fecaca 0deg, #fecaca 50deg, #e5e7eb 70deg, #e5e7eb 110deg, #bbf7d0 130deg, #bbf7d0 180deg, transparent 180deg, transparent 360deg)",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px))",
          mask:
            "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 13px))",
        }}
      />

      <svg
        viewBox="0 0 116 74"
        className="absolute left-0 top-0 h-[74px] w-[116px]"
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "58px 58px",
            transition: "transform 220ms ease",
          }}
        >
          <line
            x1="58"
            y1="58"
            x2="58"
            y2="24"
            stroke="#111827"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        <circle cx="58" cy="58" r="6.5" fill="#111827" />
      </svg>
    </div>
  );
}

function latestClientMood(project: Project, meetings: Meeting[]) {
  return meetings[0]?.clientMood ?? project.clientMood ?? "neutral";
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
    return <div className="p-6 text-sm text-gray-500">Загрузка дашборда...</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <PageTitle>Дашборд</PageTitle>
        <p className="mt-1 text-sm text-gray-500">
          Обзор всех активных проектов, состояния клиентов
        </p>
      </header>

      {sortedProjects.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
          Активных проектов пока нет.
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-4">
          {sortedProjects.map((project) => {
            const projectMeetings = meetingsByProject[project.id] ?? [];
            const clientMood = latestClientMood(project, projectMeetings);

            const clientTrend = getProjectTrend(
              projectMeetings,
              "clientMood",
            );

            const teamTrend = getProjectTrend(projectMeetings, "teamMood");

            const riskTrend = getProjectTrend(projectMeetings, "risk");

            const latestMeeting = latestMeetingLabel(projectMeetings);

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-heading text-lg font-semibold">
                      {project.name}
                    </h2>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      Клиент: {project.client ?? "Клиент не указан"}
                    </p>
                  </div>

                  <MiniGauge value={clientMood} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <SignalItem label="Клиент" trend={clientTrend} icon={Smile} />
                  <SignalItem label="Команда" trend={teamTrend} icon={Users} />
                  <SignalItem
                    label="Риск"
                    trend={riskTrend}
                    icon={ShieldAlert}
                  />
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                  <CalendarDays size={14} />
                  Последняя встреча: {formatDate(latestMeeting)}
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
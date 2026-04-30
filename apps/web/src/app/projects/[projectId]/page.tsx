"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import { PageTitle } from "@/components/page-title";
import { ProjectHealthOverview } from "@/components/project-health-overview";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";
import { formatMeetingDate } from "@/lib/types";

type Trend = "up" | "down" | "flat";

type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
};

function detectSignalType(text: string): ProjectSignal["type"] {
  const lower = text.toLowerCase();

  if (
    lower.includes("недоволь") ||
    lower.includes("проблем") ||
    lower.includes("риск") ||
    lower.includes("демотив")
  ) {
    return "risk";
  }

  if (
    lower.includes("вопрос") ||
    lower.includes("сомнен") ||
    lower.includes("обсужд")
  ) {
    return "warning";
  }

  return "opportunity";
}

function extractProjectSignals(
  meetings: Meeting[],
  limit = 5,
): ProjectSignal[] {
  const signals: ProjectSignal[] = [];

  meetings.slice(0, 10).forEach((meeting) => {
    meeting.highlights.forEach((highlight) => {
      signals.push({
        text: highlight,
        type: detectSignalType(highlight),
        date: meeting.date,
      });
    });
  });

  return signals
    .sort((a, b) => {
      const priority = { risk: 3, warning: 2, opportunity: 1 };
      return priority[b.type] - priority[a.type];
    })
    .slice(0, limit);
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

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

export default function ProjectPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);

  async function loadProjectPage() {
    setLoading(true);

    try {
      const [projectResponse, meetingsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/meetings?projectId=${projectId}`),
      ]);

      if (!projectResponse.ok) {
        setProject(null);
        setMeetings([]);
        return;
      }

      const projectData = (await projectResponse.json()) as Project;
      const meetingsData = (await meetingsResponse.json()) as Meeting[];

      setProject(projectData);
      setMeetings(meetingsData.sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProjectPage();
    }
  }, [projectId]);

  const currentClientMood: Mood = project
    ? latestClientMood(project, meetings)
    : "neutral";

  const currentTeamMood: Mood = project
    ? latestTeamMood(project, meetings)
    : "neutral";

  const currentRisk: Risk = project ? latestRisk(project, meetings) : "low";

  const previousClientMeeting = meetings.filter(
    (meeting) => meeting.hasClient !== false,
  )[1];

  const previousMeeting = meetings[1];

  const clientTrend = getTrend(
    moodScore(currentClientMood),
    moodScore(previousClientMeeting?.clientMood ?? "neutral"),
  );

  const teamTrend = getTrend(
    moodScore(currentTeamMood),
    moodScore(previousMeeting?.teamMood ?? "neutral"),
  );

  const riskTrend = getTrend(
    riskScore(currentRisk),
    riskScore(previousMeeting?.risk ?? "medium"),
  );

  const signals = useMemo(() => {
    return extractProjectSignals(meetings);
  }, [meetings]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Загрузка проекта...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8">
        <h1 className="font-heading text-xl font-semibold">
          Проект не найден
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <PageTitle>{project.name}</PageTitle>

          <p className="mt-1 text-sm text-gray-500">
            {project.client ?? "Клиент не указан"}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
        >
          <MoreHorizontal size={16} />
          Управление
        </button>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <MoodSpeedometer
          title="Клиент"
          value={currentClientMood}
          trend={clientTrend}
          trendKind="mood"
        />

        <MoodSpeedometer
          title="Команда"
          value={currentTeamMood}
          trend={teamTrend}
          trendKind="mood"
        />

        <MoodSpeedometer
          title="Риски"
          value={currentRisk}
          trend={riskTrend}
          trendKind="risk"
        />
      </section>

      <ProjectHealthOverview project={project} meetings={meetings} />

      <MoodTrendChart meetings={meetings} />

      <div className="grid grid-cols-[1.4fr_0.75fr] gap-5">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                Встречи
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Последние встречи проекта
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMeetingOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Добавить встречу
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
              Нет встреч
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  hideProjectName
                />
              ))}
            </div>
          )}
        </section>

        
{/* SIGNALS */}
<aside className="rounded-3xl border border-gray-200 bg-white p-6">
  <h2 className="text-xl font-semibold">Сигналы</h2>

  <div className="mt-5 space-y-3">
    {signals.length === 0 ? (
      <div className="text-sm text-gray-500">
        Нет значимых сигналов
      </div>
    ) : (
      signals.map((signal, index) => {
        const tone =
          signal.type === "risk"
            ? "border-red-100 bg-red-50 text-red-700"
            : signal.type === "warning"
              ? "border-amber-100 bg-amber-50 text-amber-700"
              : "border-green-100 bg-green-50 text-green-700";

        const meeting = meetings.find((item) =>
          item.highlights.includes(signal.text),
        );

        return (
          <div
            key={`${signal.date}-${index}`}
            className={`rounded-3xl border p-4 ${tone}`}
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-medium opacity-70">
              <span>{formatMeetingDate(signal.date)}</span>
              <span>·</span>
              <span>{meeting?.title ?? "Встреча"}</span>
            </div>

            <p className="text-sm font-semibold leading-6">
              {signal.text}
            </p>
          </div>
        );
      })
    )}
  </div>
</aside>

      </div>

      <AddMeetingModal
        isOpen={isAddMeetingOpen}
        onClose={() => setIsAddMeetingOpen(false)}
        initialProjectId={project.id}
        projects={[project]}
        onMeetingsChange={loadProjectPage}
      />
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MoreHorizontal, Plus, TrendingDown } from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import { PageTitle } from "@/components/page-title";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";

type Trend = "up" | "down" | "flat";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function statusLabel(status: Project["status"]) {
  if (status === "hold") return "На холде";
  if (status === "archived") return "В архиве";
  return "Активный";
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

  const latestMeeting = meetings[0];
  const previousMeeting = meetings[1];

  const currentClientMood: Mood =
    latestMeeting?.clientMood ?? project?.clientMood ?? "neutral";

  const currentTeamMood: Mood =
    latestMeeting?.teamMood ?? project?.teamMood ?? "neutral";

  const currentRisk: Risk = latestMeeting?.risk ?? project?.risk ?? "low";

  const clientTrend = getTrend(
    moodScore(currentClientMood),
    moodScore(previousMeeting?.clientMood ?? "neutral"),
  );

  const teamTrend = getTrend(
    moodScore(currentTeamMood),
    moodScore(previousMeeting?.teamMood ?? "neutral"),
  );

  const riskTrend = getTrend(
    riskScore(currentRisk),
    riskScore(previousMeeting?.risk ?? "medium"),
  );

  const hasBadSignal = useMemo(() => {
    return meetings.some(
      (meeting) => meeting.clientMood === "bad" || meeting.risk === "high",
    );
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
          <div className="mt-3">
            <PageTitle>{project.name}</PageTitle>
          </div>

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

      <MoodTrendChart meetings={meetings} />

      <div className="grid grid-cols-[1.4fr_0.75fr] items-start gap-5">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                Встречи проекта
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Последние клиентские встречи и AI-оценка состояния
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMeetingOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
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

        <aside className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
            Сигналы
          </h2>

          <div className="mt-5">
            {hasBadSignal ? (
              <div className="rounded-3xl bg-red-50 p-5 text-red-700">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingDown size={16} />
                  Есть просадка
                </div>

                <p className="mt-2 text-sm leading-6">
                  Обнаружены негативные встречи или высокий риск
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-green-50 p-5 text-green-700">
                <div className="text-sm font-semibold">
                  Всё стабильно
                </div>

                <p className="mt-2 text-sm leading-6">
                  Критичных сигналов нет
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <AddMeetingModal
        isOpen={isAddMeetingOpen}
        onClose={() => setIsAddMeetingOpen(false)}
        initialProjectId={project.id}
        projects={[project]}
        onMeetingsChange={async () => {
          const response = await fetch(`/api/meetings?projectId=${project.id}`);
          const data = (await response.json()) as Meeting[];

          setMeetings(data.sort((a, b) => b.date.localeCompare(a.date)));
        }}
      />
    </div>
  );
}
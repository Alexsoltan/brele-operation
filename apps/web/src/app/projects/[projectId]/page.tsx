"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, TrendingDown } from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import type { Meeting as UiMeeting } from "@/lib/meeting-store";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";
type ProjectStatus = "active" | "hold" | "archived";

type Project = {
  id: string;
  slug: string;
  name: string;
  client: string | null;
  status: ProjectStatus;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
};

type ApiMeeting = {
  id: string;
  projectId: string;
  title: string;
  date: string;
  meetingType: string;
  transcriptText?: string | null;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  analysisStatus: "pending" | "analyzed" | "manual" | "error";
  modelName?: string | null;
  analyzedAt?: string | null;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function normalizeMeeting(meeting: ApiMeeting): UiMeeting {
  return {
    id: meeting.id,
    projectId: meeting.projectId,
    title: meeting.title,
    date: meeting.date,
    meetingType: meeting.meetingType,
    transcriptText: meeting.transcriptText ?? undefined,
    summary: meeting.summary,
    highlights: meeting.highlights ?? [],
    clientMood: meeting.clientMood,
    teamMood: meeting.teamMood,
    risk: meeting.risk,
    analysisStatus: meeting.analysisStatus,
    modelName: meeting.modelName ?? undefined,
    analyzedAt: meeting.analyzedAt ?? undefined,
  };
}

function statusLabel(status: ProjectStatus) {
  if (status === "hold") return "На холде";
  if (status === "archived") return "В архиве";
  return "Активный";
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<UiMeeting[]>([]);
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("active");
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
      const meetingsData = (await meetingsResponse.json()) as ApiMeeting[];

      setProject(projectData);
      setStatusDraft(projectData.status);
      setMeetings(meetingsData.map(normalizeMeeting));
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

  const currentClientMood: Mood =
    latestMeeting?.clientMood ?? project?.clientMood ?? "neutral";

  const currentTeamMood: Mood =
    latestMeeting?.teamMood ?? project?.teamMood ?? "neutral";

  const currentRisk: Risk = latestMeeting?.risk ?? project?.risk ?? "low";

  const hasBadSignal = useMemo(() => {
    return meetings.some(
      (meeting) => meeting.clientMood === "bad" || meeting.risk === "high",
    );
  }, [meetings]);

  async function handleStatusChange(nextStatus: ProjectStatus) {
    if (!project) return;

    const previousProject = project;

    setStatusDraft(nextStatus);
    setProject({ ...project, status: nextStatus });

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
      }),
    });

    if (!response.ok) {
      setStatusDraft(previousProject.status);
      setProject(previousProject);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка проекта...</div>;
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
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
            {project.name}
          </h1>

          <p className="mt-1 font-body text-sm text-gray-500">
            Аналитика встреч, настроение клиента и состояние команды
          </p>

          <div className="mt-2 font-body text-sm text-gray-500">
            Статус: {statusLabel(project.status)}
          </div>
        </div>

        <div className="relative">
          <select
            value={statusDraft}
            onChange={(event) =>
              handleStatusChange(event.target.value as ProjectStatus)
            }
            className="appearance-none rounded-2xl border border-gray-200 bg-white py-2 pl-4 pr-10 font-body text-sm font-medium outline-none transition hover:border-gray-300 focus:border-black"
          >
            <option value="active">Активный</option>
            <option value="hold">Холд</option>
            <option value="archived">Архив</option>
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            ↓
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <MoodSpeedometer title="Клиент" value={currentClientMood} />
        <MoodSpeedometer title="Команда" value={currentTeamMood} />
        <MoodSpeedometer title="Риски" value={currentRisk} />
      </section>

      <MoodTrendChart />

      <div className="grid grid-cols-[1.4fr_0.9fr] gap-4">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                Встречи проекта
              </h2>

              <p className="mt-1 font-body text-sm text-gray-500">
                Последние клиентские встречи и AI-оценка состояния
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMeetingOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Добавить встречу
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              Нет встреч
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            Сигналы
          </h2>

          {hasBadSignal ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <TrendingDown size={16} />
                Есть просадка
              </div>

              <p className="mt-1 text-sm text-red-700">
                Обнаружены негативные встречи или высокий риск
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-700">
                Всё стабильно
              </div>

              <p className="mt-1 text-sm text-green-700">
                Критичных сигналов нет
              </p>
            </div>
          )}
        </aside>
      </div>

      <AddMeetingModal
        isOpen={isAddMeetingOpen}
        onClose={() => setIsAddMeetingOpen(false)}
        initialProjectId={project.id}
        projects={[project]}
     onMeetingsChange={async () => {
  const response = await fetch(`/api/meetings?projectId=${project.id}`);
  const data = (await response.json()) as ApiMeeting[];

  setMeetings(
    data
      .map(normalizeMeeting)
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
}}
      />
    </div>
  );
}
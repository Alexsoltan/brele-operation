"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import {
  canManageMeetings,
  canManageProjects,
  type UserRole,
} from "@/lib/permissions";
import type { Meeting as UiMeeting } from "@/lib/types";

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

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  workspaceId: string;
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

const statusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: "active", label: "Активный" },
  { value: "hold", label: "Холд" },
  { value: "archived", label: "Архив" },
];

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
  if (status === "hold") return "Холд";
  if (status === "archived") return "Архив";
  return "Активный";
}

function statusClassName(status: ProjectStatus) {
  if (status === "hold") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "archived") {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }

  return "border-green-200 bg-green-50 text-green-700";
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = normalizeParam(params?.projectId);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<UiMeeting[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEditProject = canManageProjects(currentUser?.role);
  const canEditMeetings = canManageMeetings(currentUser?.role);

  async function loadProjectPage() {
    setLoading(true);

    try {
      const [projectResponse, meetingsResponse, meResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/meetings?projectId=${projectId}`),
        fetch("/api/me"),
      ]);

      if (!projectResponse.ok) {
        setProject(null);
        setMeetings([]);
        return;
      }

      const projectData = (await projectResponse.json()) as Project;
      const meetingsData = (await meetingsResponse.json()) as ApiMeeting[];
      const userData = (await meResponse.json()) as CurrentUser;

      setProject(projectData);
      setMeetings(
        meetingsData
          .map(normalizeMeeting)
          .sort((a, b) => b.date.localeCompare(a.date)),
      );
      setCurrentUser(userData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProjectPage();
    }
  }, [projectId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    }

    if (isActionMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isActionMenuOpen]);

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

    setProject({ ...project, status: nextStatus });
    setIsActionMenuOpen(false);

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
      setProject(previousProject);
    }
  }

  async function handleDeleteProject() {
    if (!project) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Project delete failed");
      }

      router.push("/projects");
    } finally {
      setIsDeleting(false);
    }
  }

  async function reloadProjectMeetings() {
    if (!project) return;

    const response = await fetch(`/api/meetings?projectId=${project.id}`);
    const data = (await response.json()) as ApiMeeting[];

    setMeetings(
      data
        .map(normalizeMeeting)
        .sort((a, b) => b.date.localeCompare(a.date)),
    );
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
          <div
            className={[
              "mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium",
              statusClassName(project.status),
            ].join(" ")}
          >
            {statusLabel(project.status)}
          </div>

          <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
            {project.name}
          </h1>

          <p className="mt-1 font-body text-sm text-gray-500">
            {project.client ?? "Клиент не указан"}
          </p>
        </div>

        {canEditProject ? (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsActionMenuOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <MoreHorizontal size={17} />
              Управление
            </button>

            {isActionMenuOpen ? (
              <div className="absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-xl">
                <div className="px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-gray-400">
                  Статус проекта
                </div>

                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={[
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                      project.status === option.value
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-black",
                    ].join(" ")}
                  >
                    {option.label}
                    {project.status === option.value ? (
                      <CheckCircle2 size={15} />
                    ) : null}
                  </button>
                ))}

                <div className="my-1 h-px bg-gray-100" />

                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Удалить проект
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <section className="grid grid-cols-3 gap-4">
        <MoodSpeedometer title="Клиент" value={currentClientMood} />
        <MoodSpeedometer title="Команда" value={currentTeamMood} />
        <MoodSpeedometer title="Риски" value={currentRisk} />
      </section>

      <MoodTrendChart meetings={meetings} />

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

            {canEditMeetings ? (
              <button
                type="button"
                onClick={() => setIsAddMeetingOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                <Plus size={16} />
                Добавить встречу
              </button>
            ) : null}
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
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 size={16} />
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
        onMeetingsChange={reloadProjectMeetings}
      />

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-6 backdrop-blur-[1px]">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-full bg-red-50 p-2 text-red-600">
                  <AlertTriangle size={18} />
                </div>

                <h2 className="font-heading text-xl font-semibold">
                  Удалить проект?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Проект «{project.name}» будет скрыт из списка. Данные не
                  удаляются физически и останутся в базе.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                <Trash2 size={16} />
                {isDeleting ? "Удаляем..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
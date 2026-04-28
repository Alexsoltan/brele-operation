"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";

import {
  getProjectById,
  updateProjectStatus,
  type Project,
  type ProjectStatus,
} from "@/lib/project-store";

import { getProjectMeetings } from "@/lib/meeting-store";

import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { MoodSpeedometer } from "@/components/mood-speedometer";

interface PageProps {
  params: {
    projectId: string;
  };
}

function statusLabel(status: ProjectStatus) {
  if (status === "hold") return "На холде";
  if (status === "archived") return "В архиве";
  return "Активный";
}

export default function ProjectPage({ params }: PageProps) {
  const { projectId } = params;

  const [project, setProject] = useState<Project | undefined>();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("active");

  useEffect(() => {
    const loadedProject = getProjectById(projectId);
    setProject(loadedProject);
    setStatusDraft(loadedProject?.status ?? "active");

    const projectMeetings = getProjectMeetings(projectId);
    setMeetings(projectMeetings);
  }, [projectId]);

  function handleSaveStatus() {
    if (!project) return;

    updateProjectStatus(project.id, statusDraft);

    setProject({
      ...project,
      status: statusDraft,
    });
  }

  if (!project) {
    return (
      <div className="text-sm text-gray-500">
        Проект не найден
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к проектам
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Аналитика встреч, настроение клиента и состояние команды
            </p>
          </div>

          {/* ✅ СТАТУС РЕДАКТИРУЕТСЯ ТОЛЬКО ЗДЕСЬ */}
          <div className="flex items-center gap-2">
            <select
              value={statusDraft}
              onChange={(event) =>
                setStatusDraft(event.target.value as ProjectStatus)
              }
              className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-black"
            >
              <option value="active">Активный</option>
              <option value="hold">Холд</option>
              <option value="archived">Архив</option>
            </select>

            <button
              type="button"
              onClick={handleSaveStatus}
              disabled={statusDraft === project.status}
              className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-2 text-sm text-gray-500">
            Настроение клиента
          </div>
          <MoodSpeedometer title="Настроение клиента" value={project.clientMood} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-2 text-sm text-gray-500">
            Настроение команды
          </div>
          <MoodSpeedometer title="Настроение команды" value={project.teamMood} />
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-2 text-sm text-gray-500">
            Риск проекта
          </div>
          <MoodSpeedometer title="Риск проекта" value={project.risk} />
        </div>
      </div>

      {/* MEETINGS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Встречи проекта</h2>
            <p className="text-sm text-gray-500">
              Последние клиентские встречи и AI-оценка состояния
            </p>
          </div>

          <Link
            href={`/projects/${project.id}/meetings/new`}
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={16} />
            Добавить встречу
          </Link>
        </div>

        {meetings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
            Пока нет встреч по этому проекту
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{meeting.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {meeting.date}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <MoodBadge mood={meeting.clientMood} />
                    <RiskBadge risk={meeting.risk} />
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-600">
                  {meeting.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
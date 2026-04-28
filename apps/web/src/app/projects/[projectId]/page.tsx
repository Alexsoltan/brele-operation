"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, TrendingDown } from "lucide-react";

import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";

import {
  getProjectById,
  updateProjectStatus,
  type Project,
  type ProjectStatus,
} from "@/lib/project-store";

import {
  formatMeetingDate,
  getProjectMeetings,
  type Meeting,
} from "@/lib/meeting-store";

import type { Mood, Risk } from "@/lib/mock-data";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function statusLabel(status: ProjectStatus) {
  if (status === "hold") return "На холде";
  if (status === "archived") return "В архиве";
  return "Активный";
}

function moodLabel(value: Mood) {
  if (value === "good") return "Хорошо";
  if (value === "bad") return "Плохо";
  return "Нейтрально";
}

function riskLabel(value: Risk) {
  if (value === "high") return "Высокий";
  if (value === "medium") return "Средний";
  return "Низкий";
}

function moodTone(value: Mood) {
  if (value === "good") return "good";
  if (value === "bad") return "bad";
  return "neutral";
}

function riskTone(value: Risk) {
  if (value === "low") return "good";
  if (value === "high") return "bad";
  return "neutral";
}

function badgeClass(tone: "good" | "bad" | "neutral") {
  if (tone === "good") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (tone === "bad") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-500";
}

function MeetingSignalBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeClass(tone),
      ].join(" ")}
    >
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </span>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | undefined>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>("active");

  useEffect(() => {
    const loadedProject = getProjectById(projectId);

    setProject(loadedProject);
    setStatusDraft(loadedProject?.status ?? "active");
    setMeetings(getProjectMeetings(projectId));
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
            onChange={(event) => {
              const nextStatus = event.target.value as ProjectStatus;

              setStatusDraft(nextStatus);
              updateProjectStatus(project.id, nextStatus);
              setProject({ ...project, status: nextStatus });
            }}
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

            <Link
              href={`/projects/${projectId}/meetings/new`}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Добавить встречу
            </Link>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
              Нет встреч
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/meetings/${meeting.id}`}
                  className="block rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-heading text-base font-semibold">
                        {meeting.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays size={14} />
                        {formatMeetingDate(meeting.date)}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <MeetingSignalBadge
                        label="Клиент"
                        value={moodLabel(meeting.clientMood)}
                        tone={moodTone(meeting.clientMood)}
                      />

                      <MeetingSignalBadge
                        label="Команда"
                        value={moodLabel(meeting.teamMood)}
                        tone={moodTone(meeting.teamMood)}
                      />

                      <MeetingSignalBadge
                        label="Риск"
                        value={riskLabel(meeting.risk)}
                        tone={riskTone(meeting.risk)}
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {meeting.summary}
                  </p>
                </Link>
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Plus, TrendingDown } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import { getProjectById, type Project } from "@/lib/project-store";
import { formatMeetingDate, getProjectMeetings, type Meeting } from "@/lib/meeting-store";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = normalizeParam(params.projectId);

  const [project, setProject] = useState<Project | undefined>();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    setProject(getProjectById(projectId));
    setMeetings(getProjectMeetings(projectId));
  }, [projectId]);

  const latestMeeting = meetings[0];

  const currentClientMood = latestMeeting?.clientMood ?? project?.clientMood ?? "neutral";
  const currentTeamMood = latestMeeting?.teamMood ?? project?.teamMood ?? "neutral";
  const currentRisk = latestMeeting?.risk ?? project?.risk ?? "low";

  const hasBadSignal = useMemo(() => {
    return meetings.some((meeting) => meeting.clientMood === "bad" || meeting.risk === "high");
  }, [meetings]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/projects"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к проектам
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {project?.name ?? "Проект"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Аналитика встреч, настроение клиента и состояние команды
            </p>
          </div>

          <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
            Активный
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MoodSpeedometer title="Настроение клиента" value={currentClientMood} />
        <MoodSpeedometer title="Настроение команды" value={currentTeamMood} />
        <MoodSpeedometer title="Риск проекта" value={currentRisk} />
      </div>

      <MoodTrendChart />

      <div className="grid grid-cols-[1.4fr_0.9fr] gap-4">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Встречи проекта</h2>
              <p className="mt-1 text-sm text-gray-500">
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
            <div className="rounded-3xl border border-dashed border-gray-200 bg-[#f3f3f1] p-8 text-sm text-gray-500">
              Пока нет встреч. Добавь первую встречу, чтобы начать собирать динамику проекта.
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <article
                  key={meeting.id}
                  className="rounded-3xl border border-gray-200 bg-[#f3f3f1] p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{meeting.title}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <CalendarDays size={14} />
                        {formatMeetingDate(meeting.date)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <MoodBadge mood={meeting.clientMood} />
                      <RiskBadge risk={meeting.risk} />
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-gray-600">
                    {meeting.summary}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="mb-1 text-xs text-gray-400">Клиент</div>
                      <MoodBadge mood={meeting.clientMood} />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-gray-400">Команда</div>
                      <MoodBadge mood={meeting.teamMood} />
                    </div>

                    <div>
                      <div className="mb-1 text-xs text-gray-400">Риск</div>
                      <RiskBadge risk={meeting.risk} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Сигналы</h2>

            <div className="mt-5 space-y-4">
              {hasBadSignal ? (
                <div className="rounded-2xl bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <TrendingDown size={16} />
                    Есть просадка по встречам
                  </div>
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    В проекте есть встречи с негативным клиентским настроением или повышенным риском.
                    Нужно зафиксировать следующий шаг и ожидания клиента.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-green-50 p-4">
                  <div className="text-sm font-semibold text-green-700">
                    Критичных сигналов нет
                  </div>
                  <p className="mt-2 text-sm leading-6 text-green-700">
                    Последние встречи не показывают серьёзных рисков.
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText size={16} />
                  Следующее действие
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Подготовить краткий summary по проекту и обновить договорённости после следующей встречи.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
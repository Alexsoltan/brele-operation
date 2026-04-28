"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import {
  formatMeetingDate,
  getMeetingById,
  type Meeting,
} from "@/lib/meeting-store";
import { getProjectById, type Project } from "@/lib/project-store";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function meetingTypeLabel(value: string) {
  const labels: Record<string, string> = {
    sync: "Синк",
    demo: "Демо",
    planning: "Планирование",
    acceptance: "Приёмка",
    risk: "Разбор рисков",
  };

  return labels[value] ?? value;
}

function moodText(value: string) {
  if (value === "good") return "Хорошее";
  if (value === "bad") return "Плохое";
  return "Нейтральное";
}

function riskText(value: string) {
  if (value === "high") return "Высокий";
  if (value === "medium") return "Средний";
  return "Низкий";
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const meetingId = normalizeParam(params?.meetingId);

  const [meeting, setMeeting] = useState<Meeting | undefined>();
  const [project, setProject] = useState<Project | undefined>();

  useEffect(() => {
    if (!meetingId) return;

    const foundMeeting = getMeetingById(meetingId);
    setMeeting(foundMeeting);

    if (foundMeeting) {
      setProject(getProjectById(foundMeeting.projectId));
    }
  }, [meetingId]);

  if (!meeting) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Встреча не найдена</h1>

        <Link
          href="/meetings"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к встречам
        </Link>
      </div>
    );
  }

  const highlights = Array.isArray(meeting.highlights) ? meeting.highlights : [];
  const transcript = meeting.transcriptText?.trim();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/meetings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к встречам
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm text-gray-500">
              {project?.name ?? meeting.projectId}
            </div>

            <h1 className="mt-1 text-2xl font-semibold">{meeting.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                {formatMeetingDate(meeting.date)}
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1">
                {meetingTypeLabel(meeting.meetingType)}
              </span>

              {meeting.modelName ? (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {meeting.modelName}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href={`/projects/${meeting.projectId}`}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Открыть проект
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-3 gap-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Настроение клиента</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-lg font-semibold">
              {moodText(meeting.clientMood)}
            </div>
            <MoodBadge mood={meeting.clientMood} />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Настроение команды</div>
          <div className="mt-3 text-lg font-semibold">
            {moodText(meeting.teamMood)}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Риск проекта</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-lg font-semibold">{riskText(meeting.risk)}</div>
            <RiskBadge risk={meeting.risk} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Саммари</h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            {meeting.summary}
          </p>

          {highlights.length > 0 ? (
            <div className="mt-7">
              <h3 className="text-sm font-semibold">Инсайты</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-gray-600">
                {highlights.map((highlight, index) => (
                  <li key={`${meeting.id}-highlight-${index}`}>{highlight}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Метаданные</h2>

          <div className="mt-5 space-y-4 text-sm">
            <div>
              <div className="text-gray-500">ID встречи</div>
              <div className="mt-1 font-medium">{meeting.id}</div>
            </div>

            <div>
              <div className="text-gray-500">Статус анализа</div>
              <div className="mt-1 font-medium">
                {meeting.analysisStatus === "analyzed"
                  ? "AI-анализ"
                  : "Ручная оценка"}
              </div>
            </div>

            {meeting.analyzedAt ? (
              <div>
                <div className="text-gray-500">Дата анализа</div>
                <div className="mt-1 font-medium">
                  {new Date(meeting.analyzedAt).toLocaleString("ru-RU")}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} />
          <h2 className="text-lg font-semibold">Транскрибация</h2>
        </div>

        {transcript ? (
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-3xl bg-[#f3f3f1] p-5 text-sm leading-7 text-gray-700">
            {transcript}
          </pre>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-[#f3f3f1] p-8 text-sm text-gray-500">
            Транскрибация для этой встречи не сохранена.
          </div>
        )}
      </section>
    </div>
  );
}
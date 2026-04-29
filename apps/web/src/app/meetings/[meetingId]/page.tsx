"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";

import { UiSelect } from "@/components/ui-select";
import { PageTitle } from "@/components/page-title";
import {
  formatMeetingDate,
  type Meeting,
  type Mood,
  type Risk,
} from "@/lib/types";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const meetingTypeOptions = [
  { value: "sync", label: "Синк" },
  { value: "demo", label: "Демо" },
  { value: "planning", label: "Планирование" },
  { value: "acceptance", label: "Приёмка" },
  { value: "risk", label: "Разбор рисков" },
];

const moodOptions = [
  { value: "good", label: "Хорошо" },
  { value: "neutral", label: "Нейтрально" },
  { value: "bad", label: "Плохо" },
];

const riskOptions = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

function analysisStatusLabel(status: Meeting["analysisStatus"]) {
  if (status === "pending") return "AI-анализ выполняется";
  if (status === "error") return "Ошибка анализа";
  if (status === "manual") return "Ручная оценка";
  return "AI-анализ завершён";
}

export default function MeetingDetailsPage() {
  const params = useParams();
  const meetingId = normalizeParam(params?.meetingId);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMeeting() {
    setLoading(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`);

      if (!response.ok) {
        setMeeting(null);
        return;
      }

      const data = (await response.json()) as Meeting;
      setMeeting(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (meetingId) {
      loadMeeting();
    }
  }, [meetingId]);

  async function patchMeeting(patch: Partial<Meeting>) {
    if (!meeting) return;

    const optimisticMeeting = {
      ...meeting,
      ...patch,
    };

    setMeeting(optimisticMeeting);

    const response = await fetch(`/api/meetings/${meeting.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setMeeting(meeting);
      return;
    }

    const updatedMeeting = (await response.json()) as Meeting;
    setMeeting(updatedMeeting);
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка встречи...</div>;
  }

  if (!meeting) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8">
        <PageTitle>Встреча не найдена</PageTitle>
        <Link
          href="/meetings"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад ко встречам
        </Link>
      </div>
    );
  }

  const highlights = Array.isArray(meeting.highlights)
    ? meeting.highlights
    : [];

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/meetings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад ко встречам
        </Link>

        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm text-gray-500">
              {meeting.project?.name ?? meeting.projectId}
            </div>
              <PageTitle>{meeting.title}</PageTitle>

            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays size={16} />
              {formatMeetingDate(meeting.date)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600">
            {analysisStatusLabel(meeting.analysisStatus)}
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-5">
          <h2 className="font-heading text-lg font-semibold">
            Параметры встречи
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Можно вручную поправить тип встречи и AI-оценки
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <UiSelect
            label="Тип встречи"
            value={meeting.meetingType}
            onChange={(value) => {
              patchMeeting({
                meetingType: value,
                title:
                  meetingTypeOptions.find((option) => option.value === value)
                    ?.label ?? meeting.title,
                analysisStatus: "manual",
              });
            }}
            options={meetingTypeOptions}
          />

          <UiSelect
            label="Клиент"
            value={meeting.clientMood}
            onChange={(value) => {
              patchMeeting({
                clientMood: value as Mood,
                analysisStatus: "manual",
              });
            }}
            options={moodOptions}
          />

          <UiSelect
            label="Команда"
            value={meeting.teamMood}
            onChange={(value) => {
              patchMeeting({
                teamMood: value as Mood,
                analysisStatus: "manual",
              });
            }}
            options={moodOptions}
          />

          <UiSelect
            label="Риски"
            value={meeting.risk}
            onChange={(value) => {
              patchMeeting({
                risk: value as Risk,
                analysisStatus: "manual",
              });
            }}
            options={riskOptions}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold">Саммари</h2>

        <p className="mt-4 text-sm leading-7 text-gray-600">
          {meeting.summary}
        </p>

        {highlights.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-heading text-base font-semibold">
              Ключевые инсайты
            </h3>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-600">
              {highlights.map((highlight, index) => (
                <li key={`${meeting.id}-${index}`}>{highlight}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-gray-400" />
          <h2 className="font-heading text-lg font-semibold">
            Транскрибация
          </h2>
        </div>

        {meeting.transcriptText ? (
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-3xl bg-[#f3f3f1] p-5 font-body text-sm leading-7 text-gray-700">
            {meeting.transcriptText}
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
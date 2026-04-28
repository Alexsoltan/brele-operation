"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { createMeeting } from "@/lib/meeting-store";
import type { Mood, Risk } from "@/lib/mock-data";

type AnalysisResult = {
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  summary: string;
  problems: string;
  nextActions: string;
};

const meetingTypes = [
  "Синк с клиентом",
  "Демо клиенту",
  "Планирование этапа",
  "Приёмка работ",
  "Обсуждение рисков",
];

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function moodLabel(mood: Mood) {
  const labels: Record<Mood, string> = {
    good: "Хорошо",
    neutral: "Нейтрально",
    bad: "Плохо",
  };

  return labels[mood];
}

function riskLabel(risk: Risk) {
  const labels: Record<Risk, string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  return labels[risk];
}

function analyzeTranscript(transcript: string): AnalysisResult {
  const lower = transcript.toLowerCase();

  const hasNegative =
    lower.includes("проблем") ||
    lower.includes("недовол") ||
    lower.includes("задерж") ||
    lower.includes("не устраивает") ||
    lower.includes("риск") ||
    lower.includes("срок");

  const hasPositive =
    lower.includes("отлично") ||
    lower.includes("хорошо") ||
    lower.includes("нравится") ||
    lower.includes("согласовали") ||
    lower.includes("подходит");

  const clientMood: Mood = hasNegative ? "bad" : hasPositive ? "good" : "neutral";
  const teamMood: Mood = hasNegative ? "neutral" : hasPositive ? "good" : "neutral";
  const risk: Risk = hasNegative ? "medium" : "low";

  return {
    clientMood,
    teamMood,
    risk,
    summary:
      "AI-анализ определил ключевой контекст встречи, общее состояние коммуникации и зафиксировал основные договорённости. Это mock-анализ, позже здесь будет ответ ChatGPT API по промпту типа встречи.",
    problems: hasNegative
      ? "В транскрибации есть признаки напряжения: обсуждение сроков, рисков или ожиданий клиента."
      : "Критичных проблем в транскрибации не обнаружено.",
    nextActions: hasNegative
      ? "Зафиксировать договорённости письменно, уточнить сроки и отправить клиенту короткое summary после встречи."
      : "Отправить клиенту summary встречи и подтвердить следующие шаги.",
  };
}

export default function NewMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = normalizeParam(params.projectId);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [meetingType, setMeetingType] = useState(meetingTypes[0]);
  const [transcriptText, setTranscriptText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const canAnalyze = useMemo(() => {
    return title.trim().length > 0 && date.trim().length > 0 && transcriptText.trim().length > 0;
  }, [title, date, transcriptText]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const text = await file.text();
    setTranscriptText(text);
    setAnalysis(null);
  }

  function handleAnalyze() {
    if (!canAnalyze) return;

    setIsAnalyzing(true);

    window.setTimeout(() => {
      setAnalysis(analyzeTranscript(transcriptText));
      setIsAnalyzing(false);
    }, 1200);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !date.trim() || !analysis) return;

    createMeeting({
      projectId,
      title: title.trim(),
      date,
      meetingType,
      transcriptText,
      summary: analysis.summary,
      problems: analysis.problems,
      nextActions: analysis.nextActions,
      clientMood: analysis.clientMood,
      teamMood: analysis.teamMood,
      risk: analysis.risk,
      analysisStatus: "analyzed",
      modelName: "mock-ai",
      analyzedAt: new Date().toISOString(),
    });

    router.push(`/projects/${projectId}`);
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к проекту
        </Link>

        <h1 className="text-2xl font-semibold">Добавить встречу</h1>
        <p className="mt-1 text-sm text-gray-500">
          Загрузи TXT-транскрибацию, запусти AI-анализ и сохрани результат встречи
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Название встречи</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Например: Синк с клиентом"
              className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Дата встречи</label>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Тип встречи</label>
          <select
            value={meetingType}
            onChange={(event) => setMeetingType(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          >
            {meetingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">TXT-транскрибация</label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-[#f3f3f1] px-6 py-8 text-center transition hover:border-gray-400">
            <Upload size={22} className="text-gray-500" />
            <span className="mt-3 text-sm font-medium">
              {fileName || "Выбрать TXT-файл"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              Транскрибация будет прочитана локально в браузере
            </span>
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {transcriptText ? (
            <div className="mt-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText size={16} />
                Текст загружен
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                {transcriptText}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-between border-t border-gray-100 pt-5">
          <div className="text-sm text-gray-500">
            Сначала запусти AI-анализ, затем сохрани встречу
          </div>

          <button
            type="button"
            disabled={!canAnalyze || isAnalyzing}
            onClick={handleAnalyze}
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : null}
            {isAnalyzing ? "Анализируем..." : "Проанализировать"}
          </button>
        </div>

        {analysis ? (
          <div className="rounded-3xl border border-gray-200 bg-[#f3f3f1] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-green-700">
              <CheckCircle2 size={16} />
              AI-анализ готов
            </div>

            <div className="grid grid-cols-3 gap-3">
              <EditableSelect
                label="Клиент"
                value={analysis.clientMood}
                options={[
                  ["good", "Хорошо"],
                  ["neutral", "Нейтрально"],
                  ["bad", "Плохо"],
                ]}
                onChange={(value) =>
                  setAnalysis((current) =>
                    current ? { ...current, clientMood: value as Mood } : current,
                  )
                }
              />

              <EditableSelect
                label="Команда"
                value={analysis.teamMood}
                options={[
                  ["good", "Хорошо"],
                  ["neutral", "Нейтрально"],
                  ["bad", "Плохо"],
                ]}
                onChange={(value) =>
                  setAnalysis((current) =>
                    current ? { ...current, teamMood: value as Mood } : current,
                  )
                }
              />

              <EditableSelect
                label="Риск"
                value={analysis.risk}
                options={[
                  ["low", "Низкий"],
                  ["medium", "Средний"],
                  ["high", "Высокий"],
                ]}
                onChange={(value) =>
                  setAnalysis((current) =>
                    current ? { ...current, risk: value as Risk } : current,
                  )
                }
              />
            </div>

            <EditableTextarea
              label="Summary"
              value={analysis.summary}
              onChange={(value) =>
                setAnalysis((current) => (current ? { ...current, summary: value } : current))
              }
            />

            <EditableTextarea
              label="Проблемы"
              value={analysis.problems}
              onChange={(value) =>
                setAnalysis((current) => (current ? { ...current, problems: value } : current))
              }
            />

            <EditableTextarea
              label="Следующие действия"
              value={analysis.nextActions}
              onChange={(value) =>
                setAnalysis((current) => (current ? { ...current, nextActions: value } : current))
              }
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-2xl px-4 py-2 text-sm font-medium text-gray-500 hover:text-black"
          >
            Отмена
          </Link>

          <button
            type="submit"
            disabled={!analysis}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Сохранить встречу
          </button>
        </div>
      </form>
    </div>
  );
}

function EditableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function EditableTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-black"
      />
    </div>
  );
}
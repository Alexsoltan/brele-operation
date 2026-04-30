"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createMeeting } from "@/lib/meeting-store";
import type { Mood, Risk } from "@/lib/mock-data";

type Analysis = {
  summary: string;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  highlights: string[];
};

const meetingTypes = [
  { value: "sync", label: "Синк" },
  { value: "demo", label: "Демо" },
  { value: "planning", label: "Планирование" },
  { value: "acceptance", label: "Приёмка" },
  { value: "risk", label: "Разбор рисков" },
];

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function moodLabel(value: Mood) {
  if (value === "good") return "Хорошее";
  if (value === "bad") return "Плохое";
  return "Нейтральное";
}

function riskLabel(value: Risk) {
  if (value === "high") return "Высокий";
  if (value === "medium") return "Средний";
  return "Низкий";
}

export default function NewMeetingPage() {
  const router = useRouter();
  const params = useParams();
const projectId = normalizeParam(params?.projectId);

  const [meetingType, setMeetingType] = useState("sync");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!file) {
      alert("Загрузи TXT-файл");
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();

      const res = await fetch("/api/analyze-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Ошибка: ${data.error || "unknown"}`);
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error("Analyze error:", error);
      alert("Клиентская ошибка, смотри console");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!analysis || !file) return;

    const text = await file.text();
    const selectedType = meetingTypes.find((type) => type.value === meetingType);

    createMeeting({
      projectId,
      title: selectedType?.label ?? "Встреча",
      date: date || new Date().toISOString().slice(0, 10),
      meetingType,
      transcriptText: text,
      summary: analysis.summary,
      highlights: analysis.highlights,
      clientMood: analysis.clientMood,
      teamMood: analysis.teamMood,
      risk: analysis.risk,
      analysisStatus: "analyzed",
      modelName: "gpt-4o-mini",
      analyzedAt: new Date().toISOString(),
    });

    router.push(`/projects/${projectId}`);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      setFile(droppedFile);
      setAnalysis(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <h1 className="text-2xl font-semibold">Добавить встречу</h1>
        <p className="mt-1 text-sm text-gray-500">
          Загрузи TXT-транскрибацию, получи AI-оценку и сохрани встречу
        </p>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">Тип встречи</label>
            <select
              value={meetingType}
              onChange={(event) => setMeetingType(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
            >
              {meetingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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

          <label
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-[#f3f3f1] px-6 py-10 text-center transition hover:border-gray-400"
          >
            <div className="text-sm font-medium">
              Перетащи TXT-файл сюда или выбери файл
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Транскрибация будет отправлена на AI-анализ
            </div>

            <input
              type="file"
              accept=".txt,text/plain"
              className="mt-5 text-sm"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setAnalysis(null);
              }}
            />

            {file ? (
              <div className="mt-3 text-xs text-gray-500">{file.name}</div>
            ) : null}
          </label>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "Анализируем..." : "Проанализировать"}
          </button>
        </div>
      </section>

      {analysis ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">AI-анализ</h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Клиент</div>
              <div className="mt-1 text-sm font-semibold">
                {moodLabel(analysis.clientMood)}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Команда</div>
              <div className="mt-1 text-sm font-semibold">
                {moodLabel(analysis.teamMood)}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Риск</div>
              <div className="mt-1 text-sm font-semibold">
                {riskLabel(analysis.risk)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold">Саммари</div>
            <p className="mt-2 text-sm leading-6 text-gray-600">{analysis.summary}</p>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold">Инсайты</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-gray-600">
              {analysis.highlights.map((highlight, index) => (
                <li key={`${highlight}-${index}`}>{highlight}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-6 rounded-2xl bg-green-600 px-5 py-3 text-sm font-medium text-white hover:bg-green-700"
          >
            Сохранить встречу
          </button>
        </section>
      ) : null}
    </div>
  );
}
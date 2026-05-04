"use client";

import { useEffect, useState } from "react";
import { Brain, Save } from "lucide-react";

type AiAnalysisConfig = {
  id: string;
  systemPrompt: string;
  userPrompt: string;
  modelName: string | null;
};

const modelOptions = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-5-mini",
  "gpt-5",
];

export default function AiAnalysisSettingsPage() {
  const [config, setConfig] = useState<AiAnalysisConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);

    try {
      const response = await fetch("/api/ai-analysis-config");
      const data = await response.json();
      setConfig(data);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!config) return;

    setSaving(true);

    try {
      const response = await fetch("/api/ai-analysis-config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          userPrompt: config.userPrompt,
          modelName: config.modelName || "gpt-4o-mini",
        }),
      });

      const data = await response.json();
      setConfig(data);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[34px] bg-white p-6 text-sm text-gray-500">
        Загружаем настройки AI-анализа...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-[34px] bg-white p-6 text-sm text-gray-500">
        Конфиг AI-анализа не найден.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
              Daily AI analysis
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Ежедневный анализ проекта
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Здесь настраивается prompt и модель для дневного анализа полного
              контекста проекта: встреч, чатов, существующих сигналов и
              справочника типов сигналов.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d9ff3f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_260px] gap-4">
          <div className="rounded-[26px] bg-white/8 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/35">
              Назначение
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">
              AI должен вернуть не оценку здоровья напрямую, а список
              сигналов из управляемого справочника. Backend валидирует сигналы
              и сам пересчитывает здоровье, настроение клиента и команды.
            </p>
          </div>

          <div className="rounded-[26px] bg-[#d9ff3f] p-4 text-black">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-black/55">
              <Brain size={14} />
              Модель
            </div>

            <select
              value={config.modelName ?? "gpt-4o-mini"}
              onChange={(event) =>
                setConfig((prev) =>
                  prev ? { ...prev, modelName: event.target.value } : prev,
                )
              }
              className="mt-3 h-12 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold outline-none"
            >
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-5">
        <label className="block rounded-[34px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <div className="text-lg font-semibold text-gray-950">
              System prompt
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Правила роли, формат JSON и ограничения для AI.
            </p>
          </div>

          <textarea
            value={config.systemPrompt}
            onChange={(event) =>
              setConfig((prev) =>
                prev ? { ...prev, systemPrompt: event.target.value } : prev,
              )
            }
            rows={24}
            className="w-full resize-none rounded-[24px] border border-gray-200 bg-[#f3f3f1] p-4 font-mono text-xs leading-5 outline-none focus:border-black"
          />
        </label>

        <label className="block rounded-[34px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <div className="text-lg font-semibold text-gray-950">
              User prompt template
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Шаблон данных. Доступны переменные: project, signalTypes,
              meetings, chats, signals, date.
            </p>
          </div>

          <textarea
            value={config.userPrompt}
            onChange={(event) =>
              setConfig((prev) =>
                prev ? { ...prev, userPrompt: event.target.value } : prev,
              )
            }
            rows={24}
            className="w-full resize-none rounded-[24px] border border-gray-200 bg-[#f3f3f1] p-4 font-mono text-xs leading-5 outline-none focus:border-black"
          />
        </label>
      </section>
    </div>
  );
}
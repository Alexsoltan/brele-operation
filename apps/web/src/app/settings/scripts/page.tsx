"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, Terminal } from "lucide-react";

type ScriptResult = {
  ok: boolean;
  processedProjects?: number;
  totalProjects?: number;
  totalDays?: number;
  deletedSignals?: number;
  createdSignals?: number;
  logs?: string[];
};

export default function ScriptsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ScriptResult | null>(null);

  async function handleRun() {
    const confirmed = window.confirm(
      "Удалить все автоматические сигналы и пересоздать их заново?",
    );

    if (!confirmed) return;

    setLoading(true);
    setLogs(["🚀 Запускаем скрипт..."]);
    setResult(null);

    try {
      const response = await fetch("/api/ai-analysis/recalculate", {
        method: "POST",
      });

      const data = (await response.json()) as ScriptResult;

      setResult(data);
      setLogs(Array.isArray(data.logs) ? data.logs : ["Готово"]);
    } catch (error) {
      setResult({ ok: false });
      setLogs(["❌ Ошибка запуска скрипта", String(error)]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-[#ffd7d7] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#ffd7d7] px-3 py-1 text-xs font-bold text-[#7f1d1d]">
          <AlertTriangle size={14} />
          Danger Zone
        </div>

        <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em] text-gray-950">
          Системные скрипты
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Временный раздел для отладки системных операций. Эти действия могут
          массово менять данные, поэтому запускаем их вручную и осознанно.
        </p>
      </section>

      <section className="rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
              Signals rebuild
            </div>

            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Пересоздать автоматические сигналы
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Скрипт удалит все сигналы, кроме ручных, затем заново
              проанализирует старые встречи и создаст новые сигналы по
              актуальным prompt и справочнику типов сигналов.
            </p>

            <div className="mt-4 rounded-[24px] bg-white/8 p-4 text-sm leading-6 text-white/65">
              Что будет удалено: сигналы из встреч и чатов. <br />
              Что останется: ручные сигналы менеджера.
            </div>
          </div>

          <button
            type="button"
            onClick={handleRun}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd7d7] px-4 py-2.5 text-sm font-semibold text-[#7f1d1d] transition hover:bg-[#ffbcbc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Выполняется..." : "Запустить"}
          </button>
        </div>
      </section>

      <section className="rounded-[34px] border border-gray-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
              <Terminal size={14} />
              Execution log
            </div>

            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Лог выполнения
            </h2>
          </div>

          {result ? (
            <div className="rounded-2xl bg-[#d9ff3f] px-4 py-2 text-sm font-bold text-black">
              {result.ok ? "Успешно" : "Ошибка"}
            </div>
          ) : null}
        </div>

        {result ? (
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Проектов</div>
              <div className="mt-1 text-2xl font-semibold">
                {result.processedProjects ?? 0}/{result.totalProjects ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Дней анализа</div>
              <div className="mt-1 text-2xl font-semibold">
                {result.totalDays ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Удалено сигналов</div>
              <div className="mt-1 text-2xl font-semibold">
                {result.deletedSignals ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Создано сигналов</div>
              <div className="mt-1 text-2xl font-semibold">
                {result.createdSignals ?? 0}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f3f3f1] p-4">
              <div className="text-xs text-gray-500">Статус</div>
              <div className="mt-1 text-2xl font-semibold">
                {result.ok ? "OK" : "Fail"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="max-h-[360px] overflow-y-auto rounded-[24px] bg-[#1f1f1f] p-4 font-mono text-xs leading-6 text-white/80">
          {logs.length === 0 ? (
            <div className="text-white/35">Логов пока нет.</div>
          ) : (
            logs.map((line, index) => <div key={index}>{line}</div>)
          )}
        </div>
      </section>
    </div>
  );
}

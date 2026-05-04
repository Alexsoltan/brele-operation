"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays, RotateCcw, Terminal } from "lucide-react";

type ScriptResult = {
  ok: boolean;
  error?: string;
  date?: string;
  processedProjects?: number;
  totalProjects?: number;
  totalDays?: number;
  deletedSignals?: number;
  createdSignals?: number;
  resetProjects?: number;
  chatSummaries?: {
    summariesCreated?: number;
    summariesUpdated?: number;
    failedProjects?: number;
  };
  projectSignals?: {
    totalProjects?: number;
    processedProjects?: number;
    failedProjects?: number;
    createdSignals?: number;
  };
  logs?: string[];
};

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function ScriptsSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [date, setDate] = useState(getTodayInputValue);

  async function parseScriptResponse(response: Response): Promise<ScriptResult> {
    const text = await response.text();

    try {
      return JSON.parse(text) as ScriptResult;
    } catch {
      return {
        ok: false,
        error: `Сервер вернул не JSON: HTTP ${response.status}`,
        logs: [
          `❌ Сервер вернул не JSON: HTTP ${response.status}`,
          text.slice(0, 500),
        ],
      };
    }
  }

  function applyScriptResult(data: ScriptResult) {
    setResult(data);
    setLogs(
      Array.isArray(data.logs)
        ? data.logs
        : data.error
          ? [`❌ ${data.error}`]
          : ["Готово"],
    );
  }

  async function runScript(
    label: string,
    request: () => Promise<Response>,
    confirmText?: string,
  ) {
    if (confirmText && !window.confirm(confirmText)) return;

    setLoading(true);
    setLogs([`🚀 ${label}`]);
    setResult(null);

    try {
      const response = await request();
      const data = await parseScriptResponse(response);
      applyScriptResult(data);
    } catch (error) {
      setResult({ ok: false });
      setLogs(["❌ Ошибка запуска скрипта", String(error)]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunDailyOperations() {
    await runScript("Запускаем дневную обработку...", () =>
      fetch("/api/daily-operations/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date }),
      }),
    );
  }

  async function handleResetHealth() {
    await runScript(
      "Сбрасываем показатели проектов...",
      () =>
        fetch("/api/daily-operations/reset-health", {
          method: "POST",
        }),
      "Сбросить здоровье, риск и настроения всех проектов к базовому уровню?",
    );
  }

  async function handleRun() {
    await runScript(
      "Запускаем полный rebuild...",
      () =>
        fetch("/api/ai-analysis/recalculate", {
          method: "POST",
        }),
      "Удалить все автоматические сигналы и пересоздать их заново?",
    );
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
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
              Daily operations
            </div>

            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              Обработать день
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Скрипт создаст summary чатов за выбранную дату, затем создаст
              сигналы и пересчитает здоровье проекта, настроение клиента и
              команды.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunDailyOperations}
            disabled={loading || !date}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#d9ff3f] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarDays size={16} />
            {loading ? "Выполняется..." : "Запустить за дату"}
          </button>
        </div>

        <div className="rounded-[24px] bg-white/8 p-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-white/35">
            Дата обработки
          </label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 h-12 rounded-2xl border border-white/10 bg-white px-4 text-sm font-semibold text-black outline-none"
          />
        </div>
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

      <section className="rounded-[34px] border border-[#ffd7d7] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#ffd7d7] px-3 py-1 text-xs font-bold text-[#7f1d1d]">
              Debug reset
            </div>

            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-gray-950">
              Сбросить показатели проектов
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Вернёт здоровье проектов к 100, риск к low, настроение клиента и
              команды к neutral, а точки графика здоровья удалит.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd7d7] px-4 py-2.5 text-sm font-semibold text-[#7f1d1d] transition hover:bg-[#ffbcbc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
            Сбросить
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
                {result.projectSignals?.processedProjects ??
                  result.processedProjects ??
                  result.resetProjects ??
                  0}
                /
                {result.projectSignals?.totalProjects ??
                  result.totalProjects ??
                  result.resetProjects ??
                  0}
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
                {result.projectSignals?.createdSignals ??
                  result.createdSignals ??
                  0}
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

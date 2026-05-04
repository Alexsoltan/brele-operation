"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  RotateCcw,
  Terminal,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  getLocalDateInputValue,
  UiDatePicker,
} from "@/components/ui-date-picker";

type ScriptResult = {
  ok: boolean;
  error?: string;
  status?: string;
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

type ScriptRun = {
  id: string;
  kind: string;
  status: "queued" | "running" | "success" | "failed";
  title: string;
  input?: Record<string, unknown> | null;
  result?: ScriptResult | null;
  logs: string[];
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
};

type ScriptKind = "daily_operations" | "signals_rebuild" | "reset_health";

type PendingConfirmation = {
  label: string;
  kind: ScriptKind;
  input?: Record<string, unknown>;
  title: string;
  description: ReactNode;
  confirmText: string;
  loadingText: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatusLabel(result: ScriptResult) {
  if (result.status === "queued") return "В очереди";
  if (result.status === "running") return "Выполняется";
  if (result.status === "success" || result.ok) return "Успешно";
  return "Ошибка";
}

function getStatusClassName(result: ScriptResult) {
  if (result.status === "queued" || result.status === "running") {
    return "bg-black text-white";
  }

  if (result.status === "failed" || result.ok === false) {
    return "bg-[#ffd7d7] text-[#7f1d1d]";
  }

  return "bg-[#d9ff3f] text-black";
}

function ScriptPanel({
  eyebrow,
  title,
  description,
  details,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  details?: string;
  children?: ReactNode;
  action: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ffd7d7] px-3 py-1 text-xs font-bold text-[#7f1d1d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b6b]" />
            {eyebrow}
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-gray-950">
            {title}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {description}
          </p>

          {details ? (
            <p className="mt-4 max-w-2xl border-l border-gray-200 pl-4 text-sm leading-6 text-gray-400">
              {details}
            </p>
          ) : null}
        </div>

        <div className="shrink-0">{action}</div>
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export default function ScriptsSettingsPage() {
  const [activeKind, setActiveKind] = useState<ScriptKind | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [date, setDate] = useState(getLocalDateInputValue);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);

  async function parseJsonResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Сервер вернул не JSON: HTTP ${response.status}`);
    }
  }

  function resultFromRun(run: ScriptRun): ScriptResult {
    return {
      ...(run.result ?? {}),
      ok: run.status === "success",
      status: run.status,
      error: run.error ?? run.result?.error,
      logs: run.logs,
    };
  }

  function applyScriptRun(run: ScriptRun) {
    setActiveRunId(run.id);
    setResult(resultFromRun(run));
    setLogs(run.logs.length > 0 ? run.logs : ["Задача поставлена в очередь."]);
  }

  async function pollScriptRun(id: string) {
    while (true) {
      await sleep(2000);

      const response = await fetch(`/api/script-runs/${id}`, {
        cache: "no-store",
      });
      const data = await parseJsonResponse<{ ok: boolean; run?: ScriptRun }>(
        response,
      );

      if (!data.ok || !data.run) {
        throw new Error("Не удалось получить статус задачи");
      }

      applyScriptRun(data.run);

      if (data.run.status === "success" || data.run.status === "failed") {
        return;
      }
    }
  }

  async function startScriptRun(
    label: string,
    kind: ScriptKind,
    input?: Record<string, unknown>,
  ) {
    setActiveKind(kind);
    setLogs([`🚀 ${label}`]);
    setResult(null);
    setActiveRunId(null);

    try {
      const response = await fetch("/api/script-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          input: input ?? {},
        }),
      });
      const data = await parseJsonResponse<{ ok: boolean; run?: ScriptRun }>(
        response,
      );

      if (!response.ok || !data.ok || !data.run) {
        throw new Error("Не удалось поставить задачу в очередь");
      }

      applyScriptRun(data.run);
      await pollScriptRun(data.run.id);
    } catch (error) {
      setResult({ ok: false, status: "failed" });
      setLogs(["❌ Ошибка запуска скрипта", String(error)]);
    } finally {
      setActiveKind(null);
    }
  }

  async function handleRunDailyOperations() {
    await startScriptRun(
      "Запускаем дневную обработку...",
      "daily_operations",
      { date },
    );
  }

  function handleResetHealth() {
    setPendingConfirmation({
      label: "Сбрасываем показатели проектов...",
      kind: "reset_health",
      input: {},
      title: "Сбросить показатели проектов?",
      description:
        "Здоровье проектов вернется к 100, риск к low, настроение клиента и команды к neutral. Точки графика здоровья будут удалены.",
      confirmText: "Сбросить",
      loadingText: "Сбрасываем...",
    });
  }

  function handleRun() {
    setPendingConfirmation({
      label: "Запускаем полный rebuild...",
      kind: "signals_rebuild",
      input: {},
      title: "Пересоздать автоматические сигналы?",
      description:
        "Автоматические сигналы из встреч и чатов будут удалены и созданы заново по актуальным prompt и справочнику типов. Ручные сигналы менеджера останутся.",
      confirmText: "Пересоздать",
      loadingText: "Запускаем...",
    });
  }

  async function confirmPendingRun() {
    if (!pendingConfirmation) return;

    const confirmation = pendingConfirmation;
    setPendingConfirmation(null);

    await startScriptRun(
      confirmation.label,
      confirmation.kind,
      confirmation.input,
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex h-6 items-center gap-2 rounded-full bg-[#ffd7d7] px-3 text-xs font-bold text-[#7f1d1d]">
              <AlertTriangle size={13} />
              Danger Zone
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Системные скрипты
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Ручной запуск серверных операций, которые массово меняют данные.
              Страница показывает статус, выбранные параметры и лог выполнения.
            </p>
          </div>
        </div>
      </section>

      <ScriptPanel
        eyebrow="Daily operations"
        title="Обработать день"
        description="Создать summary чатов за выбранную дату, затем создать сигналы и пересчитать здоровье проекта, настроение клиента и команды."
        details="Используется для ежедневного запуска и ручного тестирования конкретной даты."
        action={
          <button
            type="button"
            onClick={handleRunDailyOperations}
            disabled={activeKind !== null || !date}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd7d7] px-4 py-2.5 text-sm font-semibold text-[#7f1d1d] transition hover:bg-[#ffbcbc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarDays size={16} />
            {activeKind === "daily_operations"
              ? "Выполняется..."
              : "Запустить"}
          </button>
        }
      >
        <div className="max-w-xs rounded-[20px] border border-gray-200 bg-[#fbfbfa] p-4">
          <UiDatePicker
            label="Дата обработки"
            value={date}
            onChange={setDate}
            disabled={activeKind !== null}
          />
        </div>
      </ScriptPanel>

      <ScriptPanel
        eyebrow="Signals rebuild"
        title="Пересоздать автоматические сигналы"
        description="Удалить все автоматические сигналы, затем заново проанализировать встречи и чаты по актуальному prompt и справочнику типов сигналов."
        details="Ручные сигналы менеджера остаются. Автоматические сигналы из встреч и чатов будут пересозданы."
        action={
          <button
            type="button"
            onClick={handleRun}
            disabled={activeKind !== null}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd7d7] px-4 py-2.5 text-sm font-semibold text-[#7f1d1d] transition hover:bg-[#ffbcbc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw
              size={16}
              className={
                activeKind === "signals_rebuild" ? "animate-spin" : ""
              }
            />
            {activeKind === "signals_rebuild" ? "Выполняется..." : "Запустить"}
          </button>
        }
      />

      <ScriptPanel
        eyebrow="Debug reset"
        title="Сбросить показатели проектов"
        description="Вернуть здоровье проектов к 100, риск к low, настроение клиента и команды к neutral."
        details="Также удаляются точки графика здоровья. Это отладочное действие перед повторным расчетом."
        action={
          <button
            type="button"
            onClick={handleResetHealth}
            disabled={activeKind !== null}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ffd7d7] px-4 py-2.5 text-sm font-semibold text-[#7f1d1d] transition hover:bg-[#ffbcbc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw
              size={16}
              className={activeKind === "reset_health" ? "animate-spin" : ""}
            />
            {activeKind === "reset_health" ? "Выполняется..." : "Запустить"}
          </button>
        }
      />

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
            <div
              className={`rounded-2xl px-4 py-2 text-sm font-bold ${getStatusClassName(
                result,
              )}`}
            >
              {getStatusLabel(result)}
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
                {getStatusLabel(result)}
              </div>
            </div>
          </div>
        ) : null}

        {activeRunId ? (
          <div className="mb-4 rounded-2xl bg-[#f3f3f1] p-4 text-sm leading-6 text-gray-600">
            Запуск: <span className="font-mono text-gray-950">{activeRunId}</span>
            . Вкладку можно закрыть, задача продолжит выполняться на сервере.
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

      <ConfirmDialog
        isOpen={Boolean(pendingConfirmation)}
        title={pendingConfirmation?.title ?? ""}
        description={pendingConfirmation?.description ?? null}
        confirmText={pendingConfirmation?.confirmText ?? "Подтвердить"}
        loadingText={pendingConfirmation?.loadingText ?? "Запускаем..."}
        isLoading={activeKind === pendingConfirmation?.kind}
        onConfirm={confirmPendingRun}
        onClose={() => setPendingConfirmation(null)}
      />
    </div>
  );
}

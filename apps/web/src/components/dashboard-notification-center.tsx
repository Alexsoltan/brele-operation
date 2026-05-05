"use client";

import { Bell } from "lucide-react";

import type { ProjectSignal } from "@/lib/types";

export type DashboardSignalNotification = ProjectSignal & {
  projectName: string;
};

function signalTone(signal: DashboardSignalNotification) {
  if (signal.direction === "positive") {
    return {
      card: "border-[#bdeec6]/80 bg-[#f8fff9]/80",
      dot: "bg-[#86d992]",
    };
  }

  if (signal.direction === "negative") {
    return {
      card: "border-[#ffd7d7]/90 bg-[#fff7f7]/80",
      dot: "bg-[#ff9c9c]",
    };
  }

  return {
    card: "border-gray-200/90 bg-white/72",
    dot: "bg-gray-300",
  };
}

function formatSignalDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

export function DashboardNotificationCenter({
  isOpen,
  signals,
  onClose,
  onToggle,
}: {
  isOpen: boolean;
  signals: DashboardSignalNotification[];
  onClose: () => void;
  onToggle: () => void;
}) {
  const activeSignals = signals.slice(0, 12);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="dashboard-notification-center"
        className="inline-flex items-center gap-2 rounded-[18px] bg-[#d8ff5f] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_16px_42px_rgba(140,170,32,0.18)] transition hover:-translate-y-0.5 hover:bg-[#ccf252]"
      >
        <Bell size={17} strokeWidth={2.4} />
        Сигналы
        {activeSignals.length > 0 ? (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-2 text-xs font-semibold text-white">
            {activeSignals.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <button
          type="button"
          aria-label="Закрыть центр сигналов"
          className="fixed inset-0 z-40 cursor-default bg-black/5"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="dashboard-notification-center"
        className={[
          "fixed bottom-4 right-4 top-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[34px] border border-white/70 bg-white/58 shadow-[0_34px_120px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition duration-300",
          isOpen
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-[calc(100%+2rem)] opacity-0",
        ].join(" ")}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/80 to-transparent" />

        <div className="relative flex h-full flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 scrollbar-none">
            {activeSignals.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-gray-200/90 bg-white/60 p-5 text-sm leading-5 text-gray-500">
                Значимых сигналов пока нет.
              </div>
            ) : (
              activeSignals.map((signal) => {
                const tone = signalTone(signal);
                const isHighRisk =
                  signal.severity === "critical" || signal.severity === "high";
                const dotClassName = isHighRisk ? "bg-[#ff9c9c]" : tone.dot;

                return (
                  <article
                    key={signal.id}
                    className={[
                      "relative overflow-hidden rounded-[24px] border p-3.5 shadow-[0_18px_52px_rgba(0,0,0,0.06)] backdrop-blur",
                      tone.card,
                    ].join(" ")}
                  >
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              dotClassName,
                            ].join(" ")}
                          />
                          <h3 className="truncate text-sm font-semibold text-gray-950">
                            {signal.projectName}
                          </h3>
                        </div>
                      </div>

                      <div className="shrink-0 text-right text-xs text-gray-500">
                        {formatSignalDate(signal.occurredAt)}
                      </div>
                    </div>

                    <p className="mt-1 text-sm font-semibold leading-5 text-gray-900">
                      {signal.title}
                    </p>

                    <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-gray-600">
                      {signal.text}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

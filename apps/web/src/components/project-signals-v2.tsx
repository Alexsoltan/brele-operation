"use client";

import { AlertTriangle } from "lucide-react";

import { formatMeetingDate } from "@/lib/types";
import type { ProjectSignal } from "@/lib/types";

function signalCardTone(direction: ProjectSignal["direction"]) {
  if (direction === "positive") {
    return "border-[#bdeec6] bg-[linear-gradient(135deg,#f1fff4_0%,#ffffff_66%)]";
  }

  if (direction === "negative") {
    return "border-[#ffd7d7] bg-[linear-gradient(135deg,#fff1f1_0%,#ffffff_68%)]";
  }

  return "border-gray-200 bg-white";
}

export function ProjectSignalsV2({ signals }: { signals: ProjectSignal[] }) {
  return (
    <section className="rounded-[32px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
      <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-gray-950">
        Сигналы
      </h2>

      <div className="mt-4 space-y-3">
        {signals.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 p-4 text-sm text-gray-500">
            Значимых сигналов пока нет.
          </div>
        ) : (
          signals.map((signal) => {
            const isHighRisk =
              signal.severity === "critical" || signal.severity === "high";

            return (
              <div
                key={signal.id}
                className={[
                  "relative rounded-[24px] border p-4 pr-14",
                  signalCardTone(signal.direction),
                ].join(" ")}
              >
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-500">
                    {formatMeetingDate(signal.occurredAt)}
                  </span>

                  {isHighRisk ? (
                    <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ffd7d7] text-[#7f1d1d]">
                      <AlertTriangle size={14} />
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-5 text-gray-700">
                  {signal.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

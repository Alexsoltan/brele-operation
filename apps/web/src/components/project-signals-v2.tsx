"use client";

import { AlertTriangle, CircleDot, TrendingUp } from "lucide-react";

import { formatMeetingDate } from "@/lib/types";

type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
};

function signalIcon(type: ProjectSignal["type"]) {
  if (type === "risk") return AlertTriangle;
  if (type === "warning") return CircleDot;
  return TrendingUp;
}

function signalTone(type: ProjectSignal["type"]) {
  if (type === "risk") {
    return "border-[#f8b4b4] bg-[#fff5f5] text-[#7f1d1d]";
  }

  if (type === "warning") {
    return "border-[#fff3a3] bg-[#fffbea] text-[#7c5a00]";
  }

  return "border-[#c9f5d3] bg-[#f3fff6] text-[#1f6b35]";
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
          signals.map((signal, index) => {
            const Icon = signalIcon(signal.type);

            return (
              <div
                key={`${signal.text}-${index}`}
                className={[
                  "rounded-[24px] border p-4",
                  signalTone(signal.type),
                ].join(" ")}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold opacity-80">
                  <Icon size={14} />
                  {formatMeetingDate(signal.date)}
                </div>

                <p className="text-sm leading-5">
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
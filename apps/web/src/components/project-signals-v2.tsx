"use client";

import { AlertTriangle, CircleDot, MessageCircle, TrendingUp } from "lucide-react";

import { formatMeetingDate } from "@/lib/types";

type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
  sourceLabel: string;
};

function signalIcon(type: ProjectSignal["type"]) {
  if (type === "risk") return AlertTriangle;
  if (type === "warning") return CircleDot;
  return TrendingUp;
}

function signalTone(type: ProjectSignal["type"]) {
  if (type === "risk") {
    return {
      icon: "text-[#9f2a2a]",
      marker: "bg-[#ffd7d7] text-[#7f1d1d]",
    };
  }

  if (type === "warning") {
    return {
      icon: "text-[#8a6a00]",
      marker: "bg-[#fff3a3] text-[#6f5200]",
    };
  }

  return {
    icon: "text-[#2f7a45]",
    marker: "bg-[#c9f5d3] text-[#1f5f34]",
  };
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
            const tone = signalTone(signal.type);

            return (
              <div
                key={`${signal.text}-${index}`}
                className="rounded-[24px] border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                    <MessageCircle size={12} />
                    {signal.sourceLabel}
                  </span>

                  <span className="text-xs font-semibold text-gray-500">
                    {formatMeetingDate(signal.date)}
                  </span>

                  <span
                    className={[
                      "ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full",
                      tone.marker,
                    ].join(" ")}
                  >
                    <Icon size={14} />
                  </span>
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
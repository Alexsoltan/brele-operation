"use client";

import {
  AlertTriangle,
  Bot,
  CircleDot,
  MessageCircle,
  TrendingUp,
  User,
} from "lucide-react";

import { formatMeetingDate } from "@/lib/types";
import type { ProjectSignal } from "@/lib/types";

function signalIcon(signal: ProjectSignal) {
  if (signal.severity === "critical" || signal.severity === "high") {
    return AlertTriangle;
  }

  if (signal.direction === "positive") {
    return TrendingUp;
  }

  return CircleDot;
}

function sourceIcon(source: ProjectSignal["source"]) {
  if (source === "chat") return MessageCircle;
  if (source === "manual") return User;
  return Bot;
}

function sourceLabel(source: ProjectSignal["source"]) {
  if (source === "chat") return "Чат";
  if (source === "manual") return "Ручной";
  return "Встреча";
}

function signalTone(signal: ProjectSignal) {
  if (signal.severity === "critical" || signal.severity === "high") {
    return {
      marker: "bg-[#ffd7d7] text-[#7f1d1d]",
    };
  }

  if (signal.severity === "medium") {
    return {
      marker: "bg-[#fff3a3] text-[#6f5200]",
    };
  }

  if (signal.direction === "positive") {
    return {
      marker: "bg-[#c9f5d3] text-[#1f5f34]",
    };
  }

  return {
    marker: "bg-gray-100 text-gray-600",
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
          signals.map((signal) => {
            const Icon = signalIcon(signal);
            const SourceIcon = sourceIcon(signal.source);
            const tone = signalTone(signal);

            return (
              <div
                key={signal.id}
                className="rounded-[24px] border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                    <SourceIcon size={12} />
                    {sourceLabel(signal.source)}
                  </span>

                  <span className="text-xs font-semibold text-gray-500">
                    {formatMeetingDate(signal.occurredAt)}
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
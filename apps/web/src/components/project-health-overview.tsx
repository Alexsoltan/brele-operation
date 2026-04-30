"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { TrendZoneChart } from "@/components/trend-zone-chart";
import {
  calculateProjectHealth,
  getProjectHealthLabel,
  getProjectHealthTitle,
} from "@/lib/project-health";
import type { Meeting, Project } from "@/lib/types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function ProjectHealthOverview({
  project,
  meetings,
}: {
  project?: Project | null;
  meetings: Meeting[];
}) {
  const calculated = useMemo(() => calculateProjectHealth(meetings), [meetings]);

 const chartData = useMemo(() => {
  const sorted = [...meetings].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return [];
  }

  return sorted.map((meeting, index) => ({
    date: meeting.date,
    value: index === sorted.length - 1 ? (project?.healthScore ?? calculated.score) : 100,
  }));
}, [calculated.score, meetings, project?.healthScore]);

  const score = project?.healthScore ?? calculated.score;
  const previousScore = calculated.previousScore ?? 100;
  const delta = score - previousScore;
  const label = getProjectHealthLabel(score);
  const title = getProjectHealthTitle(score);
  const summary = project?.healthSummary ?? calculated.summary;

  const tone =
    label === "critical" ? "red" : label === "attention" ? "yellow" : "green";

  const styles =
    tone === "red"
      ? {
          card: "border-red-100 bg-red-50 text-red-800",
          icon: "bg-red-100 text-red-700",
        }
      : tone === "yellow"
        ? {
            card: "border-amber-100 bg-amber-50 text-amber-800",
            icon: "bg-amber-100 text-amber-700",
          }
        : {
            card: "border-green-100 bg-green-50 text-green-800",
            icon: "bg-green-100 text-green-700",
          };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Динамика проекта</h2>
        <p className="text-sm text-gray-500">
          Общая оценка проекта на основе рисков и сигналов
        </p>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <div className={`rounded-3xl border p-4 ${styles.card}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-end gap-3">
                <div className="text-5xl font-semibold leading-none">
                  {score}
                </div>

                <div className="mb-1 flex items-center gap-1 text-sm font-semibold">
                  {delta >= 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </div>
              </div>

              <div className="mt-2 text-sm font-semibold">{title}</div>
            </div>

            <div className={`rounded-full p-2 ${styles.icon}`}>
              {tone === "red" ? (
                <AlertTriangle size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm leading-6">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-60">
              AI summary
            </div>

            {summary}
          </div>
        </div>

        <TrendZoneChart
          compact
          series={[
            {
              id: "health",
              points: chartData,
              strokeClassName: "stroke-[#111827]",
              dotClassName: "fill-[#111827]",
            },
          ]}
          eventDates={meetings.map((meeting) => meeting.date)}
          initialValue={100}
          defaultPeriod="month"
          yLabels={{
            top: "Хорошо",
            middle: "Средне",
            bottom: "Критично",
          }}
        />
      </div>
    </section>
  );
}
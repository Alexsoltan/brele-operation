"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

import { TrendZoneChart } from "@/components/trend-zone-chart";
import {
  calculateProjectHealth,
  getProjectHealthLabel,
  getProjectHealthTitle,
  meetingImpact,
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
    let score = 100;

    return sorted.map((meeting) => {
      score = clamp(score + meetingImpact(meeting));

      return {
        date: meeting.date,
        value: score,
      };
    });
  }, [meetings]);

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
          dot: "bg-red-500",
        }
      : tone === "yellow"
        ? {
            card: "border-amber-100 bg-amber-50 text-amber-800",
            icon: "bg-amber-100 text-amber-700",
            dot: "bg-amber-500",
          }
        : {
            card: "border-green-100 bg-green-50 text-green-800",
            icon: "bg-green-100 text-green-700",
            dot: "bg-green-500",
          };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Динамика проекта</h2>
        <p className="text-sm text-gray-500">
          Общая оценка проекта на основе рисков и сигналов
        </p>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-5">
        <div className={`relative rounded-3xl border p-6 ${styles.card}`}>
          <div className="flex justify-between">
            <div className={`rounded-full p-2 ${styles.icon}`}>
              {tone === "red" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>

            <div className={`h-3 w-3 rounded-full ${styles.dot}`} />
          </div>

          <div className="mt-8 text-5xl font-semibold">{score}</div>
          <div className="mt-2 text-sm font-semibold">{title}</div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {delta >= 0 ? "+" : ""}
            {delta} за период
          </div>

          <div className="mt-6 rounded-2xl bg-white/75 p-4 text-sm leading-6">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-60">
              AI summary
            </div>
            {summary}
          </div>
        </div>

        <TrendZoneChart
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
          defaultPeriod="quarter"
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
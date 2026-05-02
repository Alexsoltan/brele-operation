"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { Meeting, Project } from "@/lib/types";

type Range = "month" | "quarter" | "year" | "all";

type HealthPoint = {
  id: string;
  date: string;
  score: number;
  delta: number;
  impact: number;
};

function healthTitle(score: number) {
  if (score >= 90) return "Отлично";
  if (score >= 80) return "Стабильно";
  if (score >= 70) return "Появились риски";
  if (score >= 50) return "Критично";
  return "Паника";
}

function healthTone(score: number) {
  if (score >= 80) {
    return {
      hero: "bg-gradient-to-br from-[#c9f5d3] via-[#b7efc4] to-[#9ee6b2] text-black",
      bubble: "bg-black/10 text-black",
      line: "#f7f7f4",
    };
  }

  if (score >= 70) {
    return {
      hero: "bg-gradient-to-br from-[#f6ff8f] via-[#ffe98a] to-[#ffd36b] text-black",
      bubble: "bg-black/10 text-black",
      line: "#f7f7f4",
    };
  }

  return {
    hero: "bg-gradient-to-br from-[#ffd7d7] via-[#ffc0c0] to-[#ff9c9c] text-[#7f1d1d]",
    bubble: "bg-red-900/10 text-[#7f1d1d]",
    line: "#f7f7f4",
  };
}

function trendIcon(delta: number) {
  if (delta > 0) return <ArrowUpRight size={15} />;
  if (delta < 0) return <ArrowDownRight size={15} />;
  return <Activity size={15} />;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function getRangeStart(range: Range, latestDate: Date) {
  const date = new Date(latestDate);

  if (range === "month") date.setMonth(date.getMonth() - 1);
  if (range === "quarter") date.setMonth(date.getMonth() - 3);
  if (range === "year") date.setFullYear(date.getFullYear() - 1);

  return date;
}
function buildSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  if (points.length === 1) {
    return `M 0 ${points[0].y} L 100 ${points[0].y}`;
  }

  const radius = 1.5;
  let path = `M 0 ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const beforeX = Math.max(prev.x, curr.x - radius);
    const afterX = Math.min(curr.x + radius, 100);

    path += ` L ${beforeX} ${prev.y}`;
    path += ` Q ${curr.x} ${prev.y} ${curr.x} ${curr.y}`;
    path += ` L ${afterX} ${curr.y}`;
  }

  const last = points[points.length - 1];
  path += ` L 100 ${last.y}`;

  return path;
}

function normalizeChartPoints(points: HealthPoint[]) {
  if (points.length === 0) return [];

  return points.map((point, index) => {
    const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
    const y = 100 - point.score;

    return {
      ...point,
      x,
      y,
    };
  });
}

function normalizeMarkerPoints(points: ReturnType<typeof normalizeChartPoints>) {
  const radius = 1.5;

  return points.map((point, index) => {
    if (index === 0) return { ...point, x: 0 };

    return {
      ...point,
      x: Math.min(point.x + radius, 100),
    };
  });
}

export function ProjectHealthV2({
  project,
  healthPoints,
}: {
  project: Project;
  meetings: Meeting[];
  healthPoints: HealthPoint[];
}) {
  const [range, setRange] = useState<Range>("month");

  const score = project.healthScore ?? 100;
  const tone = healthTone(score);

  const sortedPoints = useMemo(() => {
    return [...healthPoints].sort((a, b) => a.date.localeCompare(b.date));
  }, [healthPoints]);

  const chartPoints = useMemo(() => {
    if (sortedPoints.length === 0) {
      return [
        {
          id: "current",
          date: new Date().toISOString(),
          score,
          delta: 0,
          impact: 0,
        },
      ];
    }

    if (range === "all") return sortedPoints;

    const latestDate = new Date(sortedPoints[sortedPoints.length - 1].date);
    const from = getRangeStart(range, latestDate);

    const filtered = sortedPoints.filter((point) => {
      return new Date(point.date) >= from;
    });

    return filtered.length > 0 ? filtered : sortedPoints.slice(-1);
  }, [range, score, sortedPoints]);

  const latestPoint = chartPoints[chartPoints.length - 1];
  const previousPoint = chartPoints[chartPoints.length - 2];

  const delta =
    typeof latestPoint?.delta === "number"
      ? latestPoint.delta
      : previousPoint
        ? latestPoint.score - previousPoint.score
        : 0;

  const normalizedPoints = normalizeChartPoints(chartPoints);
  const markerPoints = normalizeMarkerPoints(normalizedPoints);
  const path = buildSvgPath(normalizedPoints);
    return (
    <section className="rounded-[34px] bg-[#1f1f1f] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]">
      <div className="mb-4 flex items-start justify-between gap-5">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
            Динамика проекта
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Общая оценка проекта на основе встреч, рисков и сигналов.
          </p>
        </div>

        <div className="inline-flex rounded-full bg-white/10 p-1 text-xs font-medium text-white/55">
          {[
            ["month", "Месяц"],
            ["quarter", "Квартал"],
            ["year", "Год"],
            ["all", "Всё"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value as Range)}
              className={[
                "rounded-full px-3 py-1.5 transition",
                range === value ? "bg-white text-black" : "hover:bg-white/10",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[230px_1fr] gap-4">
        <div className="space-y-5">
          <div
            className={[
              "relative overflow-hidden rounded-[28px] p-5",
              tone.hero,
            ].join(" ")}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/35 blur-3xl" />

            <div className="relative flex items-start gap-2">
              <div className="font-heading text-6xl font-semibold leading-none tracking-[-0.08em]">
                {score}
              </div>

              <div
                className={[
                  "mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                  tone.bubble,
                ].join(" ")}
              >
                {trendIcon(delta)}
                {delta > 0 ? `+${delta}` : delta}
              </div>
            </div>

            <div className="relative mt-2 text-base font-semibold">
              {healthTitle(score)}
            </div>
          </div>

          <div className="px-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/35">
              AI summary
            </div>

            <p className="mt-3 line-clamp-5 text-sm leading-5 text-white/80">
              {project.healthSummary ||
                "Пока недостаточно данных для уверенного вывода."}
            </p>
          </div>
        </div>

        <div className="relative min-h-[315px]">
          <div className="absolute inset-x-0 bottom-4 top-5">
            <div className="absolute bottom-10 left-6 top-2 w-px bg-white/12" />
            <div className="absolute bottom-10 left-6 right-6 h-px bg-white/12" />
            <div className="absolute bottom-10 left-6 right-6 top-[30%] h-px bg-[#f8b4b4]/70" />

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-x-6 bottom-10 top-2 h-[230px] w-[calc(100%-48px)] overflow-visible"
            >
              <path
                d={path}
                fill="none"
                stroke={tone.line}
                strokeWidth="1.35"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="absolute inset-x-6 bottom-10 top-2">
              {markerPoints.map((point) => (
                <div
                  key={point.id}
                  className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f7f7f4] shadow-[0_0_0_3px_rgba(31,31,31,0.95)]"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  title={`${formatShortDate(point.date)} · ${point.score}`}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-6 right-6 flex justify-between text-[12px] text-white/35">
              {chartPoints.length <= 1 ? (
                <span>{formatShortDate(chartPoints[0].date)}</span>
              ) : (
                <>
                  <span>{formatShortDate(chartPoints[0].date)}</span>
                  <span>
                    {formatShortDate(chartPoints[chartPoints.length - 1].date)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
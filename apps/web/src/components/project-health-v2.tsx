"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { Meeting, Project } from "@/lib/types";

type Range = "week" | "month" | "quarter" | "year" | "all";

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
  const date = new Date(value);

  return `${String(date.getDate()).padStart(2, "0")}.${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function formatMonthTick(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    month: "short",
  });
}

function getRangeStart(range: Range, latestDate: Date) {
  const date = new Date(latestDate);

  if (range === "week") date.setDate(date.getDate() - 7);
  if (range === "month") date.setMonth(date.getMonth() - 1);
  if (range === "quarter") date.setMonth(date.getMonth() - 3);
  if (range === "year") date.setFullYear(date.getFullYear() - 1);

  return date;
}

function dayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function aggregateHealthPointsByDay(points: HealthPoint[]) {
  const map = new Map<string, HealthPoint>();

  for (const point of points) {
    const key = dayKey(point.date);
    const existing = map.get(key);

    map.set(key, {
      id: existing ? `${existing.id}-${point.id}` : point.id,
      date: `${key}T12:00:00.000Z`,
      score: point.score,
      delta: (existing?.delta ?? 0) + point.delta,
      impact: (existing?.impact ?? 0) + point.impact,
    });
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildRangeChartPoints(
  points: HealthPoint[],
  range: Range,
  currentScore: number,
) {
  const rangeEnd =
    points.length > 0
      ? new Date(points[points.length - 1].date)
      : new Date();

  if (range === "all") {
    const rangeStart =
      points.length > 0 ? new Date(points[0].date) : new Date(rangeEnd);

    return {
      rangeStart,
      rangeEnd,
      points:
        points.length > 0
          ? points
          : [
              {
                id: "current",
                date: rangeEnd.toISOString(),
                score: currentScore,
                delta: 0,
                impact: 0,
              },
            ],
    };
  }

  const rangeStart = getRangeStart(range, rangeEnd);

  const previousPoint = [...points]
    .reverse()
    .find((point) => new Date(point.date) < rangeStart);

  const pointsInRange = points.filter((point) => {
    const date = new Date(point.date);
    return date >= rangeStart && date <= rangeEnd;
  });

  const baselineScore =
    previousPoint?.score ?? pointsInRange[0]?.score ?? currentScore;

  const baselinePoint: HealthPoint = {
    id: "baseline",
    date: rangeStart.toISOString(),
    score: baselineScore,
    delta: 0,
    impact: 0,
  };

  return {
    rangeStart,
    rangeEnd,
    points: [baselinePoint, ...pointsInRange],
  };
}


function buildSvgPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";

  if (points.length === 1) {
    return `M 0 ${points[0].y} L 100 ${points[0].y}`;
  }

  let path = `M 0 ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // 1. идем горизонтально до новой точки
    path += ` L ${curr.x} ${prev.y}`;

    // 2. потом вертикально вниз/вверх
    path += ` L ${curr.x} ${curr.y}`;
  }

  const last = points[points.length - 1];

  // дотянуть до конца графика
  path += ` L 100 ${last.y}`;

  return path;
}

function normalizeChartPoints(
  points: HealthPoint[],
  rangeStart: Date,
  rangeEnd: Date,
) {
  if (points.length === 0) return [];

  const startTime = rangeStart.getTime();
  const endTime = rangeEnd.getTime();
  const duration = Math.max(1, endTime - startTime);

  return points.map((point) => {
    const time = new Date(point.date).getTime();
    const x = ((time - startTime) / duration) * 100;
    const y = 100 - point.score;

    return {
      ...point,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  });
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function addMonths(date: Date, months: number) {
  const value = new Date(date);
  value.setMonth(value.getMonth() + months);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function nextMonday(date: Date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = (8 - day) % 7 || 7;
  return addDays(value, diff);
}

function getDateTicks(range: Range, rangeStart: Date, rangeEnd: Date) {
  const ticks: Array<{ id: string; date: string; x: number }> = [];

  const startTime = rangeStart.getTime();
  const endTime = rangeEnd.getTime();
  const duration = Math.max(1, endTime - startTime);

  function pushTick(date: Date) {
    const x = ((date.getTime() - startTime) / duration) * 100;

    if (x < 0 || x > 100) return;

    ticks.push({
      id: date.toISOString(),
      date: date.toISOString(),
      x,
    });
  }

  if (range === "week") {
    let cursor = new Date(rangeStart);

    while (cursor <= rangeEnd) {
      pushTick(cursor);
      cursor = addDays(cursor, 1);
    }

    return ticks;
  }

  if (range === "month") {
    let cursor = nextMonday(rangeStart);

    while (cursor < rangeEnd) {
      const daysToRangeEnd =
        (rangeEnd.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24);

      if (daysToRangeEnd >= 3) {
        pushTick(cursor);
      }

      cursor = addDays(cursor, 7);
    }

    pushTick(rangeEnd);

    return ticks;
  }

  if (range === "quarter" || range === "year" || range === "all") {
    let cursor = startOfMonth(rangeStart);

    if (cursor < rangeStart) {
      cursor = addMonths(cursor, 1);
    }

    while (cursor < rangeEnd) {
      pushTick(cursor);
      cursor = addMonths(cursor, 1);
    }

    return ticks;
  }

  return ticks;
}

export function ProjectHealthV2({
  project,
  healthPoints,
}: {
  project: Project;
  meetings: Meeting[];
  healthPoints: HealthPoint[];
}) {
  const [range, setRange] = useState<Range>("week");

  const score = project.healthScore ?? 100;
  const tone = healthTone(score);

  const sortedPoints = useMemo(() => {
  const sorted = [...healthPoints].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return aggregateHealthPointsByDay(sorted);
}, [healthPoints]);

  const chartData = useMemo(() => {
    return buildRangeChartPoints(sortedPoints, range, score);
}, [range, score, sortedPoints]);

  const chartPoints = chartData.points;

  const latestPoint = chartPoints[chartPoints.length - 1];
  const previousPoint = chartPoints[chartPoints.length - 2];

  const delta =
    typeof latestPoint?.delta === "number"
      ? latestPoint.delta
      : previousPoint
        ? latestPoint.score - previousPoint.score
        : 0;

  const normalizedPoints = normalizeChartPoints(
    chartPoints,
    chartData.rangeStart,
    chartData.rangeEnd,
  );

  const markerPoints = normalizedPoints;
  
  const dateTicks = getDateTicks(
  range,
  chartData.rangeStart,
  chartData.rangeEnd,
  );
  
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
            ["week", "Неделя"],
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

      <div className="grid grid-cols-[190px_minmax(0,1fr)] gap-4">
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
            <div className="absolute bottom-10 left-12 right-6 h-px bg-white/25" />
            <div className="absolute bottom-10 left-12 right-6 top-[30%] h-px border-t border-dashed border-[#f8b4b4]/70" />

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute bottom-10 left-12 right-6 top-2 h-[230px] w-[calc(100%-72px)] overflow-visible"
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

            <div className="absolute bottom-10 left-12 right-6 top-2">
              {markerPoints
                .filter((point) => point.id !== "baseline")
                .map((point) => (
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

            <div className="absolute bottom-2 left-12 right-6 h-5">
              {dateTicks.map((point, index) => (
                <span
                  key={`${point.id}-${index}`}
                  className={[
                    "absolute top-0 whitespace-nowrap text-[11px] text-white/35",
                    index === 0
                      ? "translate-x-0"
                      : index === dateTicks.length - 1
                        ? "-translate-x-full"
                        : "-translate-x-1/2",
                  ].join(" ")}
                  style={{
                    left: `${point.x}%`,
                  }}
                >
                  {range === "quarter" || range === "year" || range === "all"
                    ? formatMonthTick(point.date)
                    : formatShortDate(point.date)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

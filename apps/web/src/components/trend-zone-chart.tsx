"use client";

import { useMemo, useState } from "react";

export type TrendChartPeriod = "month" | "quarter" | "halfyear" | "year" | "all";

export type TrendChartPoint = {
  date: string;
  value: number;
};

export type TrendChartSeries = {
  id: string;
  points: TrendChartPoint[];
  strokeClassName?: string;
  dotClassName?: string;
};

type TrendZoneChartProps = {
  series: TrendChartSeries[];
  eventDates?: string[];
  initialValue?: number;
  defaultPeriod?: TrendChartPeriod;
  yLabels?: {
    top: string;
    middle: string;
    bottom: string;
  };
};

const periodOptions: Array<{ value: TrendChartPeriod; label: string; days?: number }> = [
  { value: "month", label: "Месяц", days: 30 },
  { value: "quarter", label: "Квартал", days: 90 },
  { value: "halfyear", label: "Полгода", days: 183 },
  { value: "year", label: "Год", days: 365 },
  { value: "all", label: "Все" },
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function keyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function buildDays(start: Date, end: Date) {
  const days: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getPeriodRange(period: TrendChartPeriod, series: TrendChartSeries[]) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (period !== "all") {
    const days = periodOptions.find((item) => item.value === period)?.days ?? 30;
    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    return { start, end };
  }

  const firstPoint = series
    .flatMap((item) => item.points)
    .map((point) => parseDate(point.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!firstPoint) {
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    return { start, end };
  }

  return { start: firstPoint, end };
}

function buildSoftStepPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (previous.y === current.y) {
      path += ` L ${current.x} ${current.y}`;
      continue;
    }

    const curve = Math.min(28, (current.x - previous.x) * 0.48);

    path += ` L ${current.x - curve} ${previous.y}`;
    path += ` C ${current.x - curve / 2} ${previous.y}, ${
      current.x - curve / 2
    } ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function formatAxisTick(date: Date, index: number, total: number) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (total <= 35) {
    if (isFirst || isLast || index % 7 === 0) return formatDate(date);
    return "";
  }

  if (total <= 100) {
    if (isFirst || isLast || index % 15 === 0) return formatDate(date);
    return "";
  }

  if (isFirst || isLast || index % 45 === 0) return formatDate(date);

  return "";
}

export function TrendZoneChart({
  series,
  eventDates = [],
  initialValue = 100,
  defaultPeriod = "month",
  yLabels = {
    top: "Хорошо",
    middle: "Средне",
    bottom: "Критично",
  },
}: TrendZoneChartProps) {
  const [period, setPeriod] = useState<TrendChartPeriod>(defaultPeriod);

  const chart = useMemo(() => {
    const { start, end } = getPeriodRange(period, series);
    const days = buildDays(start, end);
    const total = Math.max(days.length - 1, 1);

    const startX = 92;
    const endX = 940;
    const topY = 30;
    const chartHeight = 220;

    const eventKeys = new Set(
      eventDates
        .map((value) => parseDate(value))
        .filter((date): date is Date => Boolean(date))
        .map((date) => keyFromDate(date)),
    );

    const renderedSeries = series.map((item, seriesIndex) => {
      const pointsByDay = new Map<string, number>();

      item.points.forEach((point) => {
        const date = parseDate(point.date);
        if (!date) return;

        pointsByDay.set(keyFromDate(date), clamp(point.value));
      });

      let currentValue = clamp(item.points[0]?.value ?? initialValue);

      const points = days.map((day, index) => {
        const key = keyFromDate(day);

        if (pointsByDay.has(key)) {
          currentValue = pointsByDay.get(key) ?? currentValue;
        }

        const x = startX + (index * (endX - startX)) / total;
        const y = topY + ((100 - currentValue) / 100) * chartHeight;
        const sameValueOffset = series.length > 1 ? seriesIndex * 5 - 2.5 : 0;

        return {
          key,
          date: day,
          x,
          y: y + sameValueOffset,
          value: currentValue,
          hasEvent: eventKeys.has(key) || pointsByDay.has(key),
        };
      });

      return {
        ...item,
        points,
        path: buildSoftStepPath(
          points.map((point) => ({
            x: point.x,
            y: point.y,
          })),
        ),
      };
    });

    const eventPoints = days
      .map((day, index) => {
        const key = keyFromDate(day);
        const hasEvent =
          eventKeys.has(key) ||
          renderedSeries.some((item) =>
            item.points.some((point) => point.key === key && point.hasEvent),
          );

        if (!hasEvent) return null;

        return {
          key,
          date: day,
          x: startX + (index * (endX - startX)) / total,
          label: formatDate(day),
        };
      })
      .filter((point): point is NonNullable<typeof point> => Boolean(point));

    return {
      days,
      total: days.length,
      renderedSeries,
      eventPoints,
      eventXs: eventPoints.map((point) => point.x),
      eventKeys: new Set(eventPoints.map((point) => point.key)),
    };
  }, [eventDates, initialValue, period, series]);

  return (
    <div className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-5">
      <div className="mb-2 flex justify-end">
        <div className="flex rounded-2xl bg-[#f3f3f1] p-1">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={[
                "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                period === option.value
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-white hover:text-black",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 1000 320" className="h-[360px] w-full">
        <defs>
          <linearGradient id="trendZoneBackground" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.9" />
            <stop offset="27%" stopColor="#dcfce7" stopOpacity="0.32" />
            <stop offset="39%" stopColor="#fef3c7" stopOpacity="0.78" />
            <stop offset="61%" stopColor="#fef3c7" stopOpacity="0.78" />
            <stop offset="73%" stopColor="#fee2e2" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#fee2e2" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <rect
          x="84"
          y="30"
          width="872"
          height="250"
          rx="24"
          fill="url(#trendZoneBackground)"
        />

        <line x1="84" y1="72" x2="956" y2="72" stroke="#e8eee8" />
        <line x1="84" y1="155" x2="956" y2="155" stroke="#eee7d3" />
        <line x1="84" y1="238" x2="956" y2="238" stroke="#eee2e2" />

        <text x="0" y="76" fontSize="12" fill="#9ca3af">
          {yLabels.top}
        </text>

        <text x="0" y="159" fontSize="12" fill="#9ca3af">
          {yLabels.middle}
        </text>

        <text x="0" y="242" fontSize="12" fill="#9ca3af">
          {yLabels.bottom}
        </text>

        {chart.eventPoints.map((point) => (
          <line
            key={`line-${point.key}`}
            x1={point.x}
            y1="40"
            x2={point.x}
            y2="282"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
        ))}

        {chart.days.map((day, index) => {
          const key = keyFromDate(day);
          const label = formatAxisTick(day, index, chart.total);

          if (!label) return null;

          const x = 92 + (index * (940 - 92)) / Math.max(chart.total - 1, 1);
          const isEventDay = chart.eventKeys.has(key);
          const isTooCloseToEvent = chart.eventXs.some(
            (eventX) => Math.abs(eventX - x) < 56,
          );

          if (isEventDay || isTooCloseToEvent) return null;

          return (
            <text
              key={key}
              x={x}
              y="305"
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
            >
              {label}
            </text>
          );
        })}

        {chart.eventPoints.map((point) => (
          <text
            key={`event-date-${point.key}`}
            x={point.x}
            y="305"
            textAnchor="middle"
            fontSize="10"
            fill="#111827"
            fontWeight="700"
          >
            {point.label}
          </text>
        ))}

        {chart.renderedSeries.map((item) => (
          <g key={item.id}>
            <path
              d={item.path}
              fill="none"
              className={item.strokeClassName ?? "stroke-[#111827]"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {item.points
              .filter((point) => point.hasEvent)
              .map((point) => (
                <circle
                  key={`${item.id}-${point.key}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  className={item.dotClassName ?? "fill-[#111827]"}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
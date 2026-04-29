"use client";

import { useMemo, useState } from "react";
import type { Meeting, Mood } from "@/lib/types";

type Period = "month" | "quarter" | "halfyear" | "year" | "all";

const periodOptions: Array<{ value: Period; label: string; days?: number }> = [
  { value: "month", label: "Месяц", days: 30 },
  { value: "quarter", label: "Квартал", days: 90 },
  { value: "halfyear", label: "Полгода", days: 183 },
  { value: "year", label: "Год", days: 365 },
  { value: "all", label: "Все" },
];

const moodY: Record<Mood, number> = {
  good: 42,
  neutral: 104,
  bad: 166,
};

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function keyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPeriodRange(period: Period, meetings: Meeting[]) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (period !== "all") {
    const days = periodOptions.find((item) => item.value === period)?.days ?? 30;
    const start = new Date(end);

    start.setDate(end.getDate() - days + 1);

    return { start, end };
  }

  const firstMeeting = meetings
    .map((meeting) => parseDate(meeting.date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!firstMeeting) {
    const start = new Date(end);
    start.setDate(end.getDate() - 29);

    return { start, end };
  }

  return { start: firstMeeting, end };
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

    const dx = current.x - previous.x;
    const curve = Math.min(28, dx * 0.48);

    path += ` L ${current.x - curve} ${previous.y}`;
    path += ` C ${current.x - curve / 2} ${previous.y}, ${current.x - curve / 2} ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function formatTick(date: Date, index: number, total: number) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  if (total <= 35) {
    if (isFirst || isLast || index % 7 === 0) {
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
      });
    }

    return "";
  }

  if (total <= 100) {
    if (isFirst || isLast || index % 15 === 0) {
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "short",
      });
    }

    return "";
  }

  if (isFirst || isLast || index % 45 === 0) {
    return date.toLocaleDateString("ru-RU", {
      month: "short",
    });
  }

  return "";
}

export function MoodTrendChart({ meetings }: { meetings: Meeting[] }) {
  const [period, setPeriod] = useState<Period>("month");

  const chart = useMemo(() => {
    const { start, end } = getPeriodRange(period, meetings);
    const days = buildDays(start, end);

    const meetingsByDay = new Map<string, Meeting[]>();

    meetings.forEach((meeting) => {
      const date = parseDate(meeting.date);
      if (!date) return;

      const key = keyFromDate(date);
      const items = meetingsByDay.get(key) ?? [];

      items.push(meeting);
      meetingsByDay.set(key, items);
    });

    let clientMood: Mood = "neutral";
    let teamMood: Mood = "neutral";

    const total = Math.max(days.length - 1, 1);
    const startX = 72;
    const endX = 940;

    const points = days.map((day, index) => {
      const key = keyFromDate(day);
      const dayMeetings = meetingsByDay.get(key) ?? [];

      if (dayMeetings.length > 0) {
        const latestMeeting = [...dayMeetings].sort((a, b) =>
          b.date.localeCompare(a.date),
        )[0];

        clientMood = latestMeeting.clientMood;
        teamMood = latestMeeting.teamMood;
      }

      const sameMood = clientMood === teamMood;
      const x = startX + (index * (endX - startX)) / total;

      return {
        key,
        date: day,
        x,
        clientY: moodY[clientMood] + (sameMood ? -5 : 0),
        teamY: moodY[teamMood] + (sameMood ? 5 : 0),
        meetings: dayMeetings,
      };
    });

    return {
      points,
      total: days.length,
      clientPath: buildSoftStepPath(
        points.map((point) => ({ x: point.x, y: point.clientY })),
      ),
      teamPath: buildSoftStepPath(
        points.map((point) => ({ x: point.x, y: point.teamY })),
      ),
    };
  }, [meetings, period]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            Динамика настроения
          </h2>

          <div className="mt-3 flex items-center gap-5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-black" />
              Клиент
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              Команда
            </div>
          </div>
        </div>

        <div className="flex shrink-0 rounded-2xl bg-[#f3f3f1] p-1">
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

      <svg viewBox="0 0 1000 235" className="h-72 w-full">
        <defs>
          <linearGradient id="goodZone" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#dcfce7" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="badZone" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fee2e2" stopOpacity="0" />
            <stop offset="100%" stopColor="#fee2e2" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <rect
          x="66"
          y="20"
          width="890"
          height="72"
          rx="18"
          fill="url(#goodZone)"
        />
        <rect
          x="66"
          y="116"
          width="890"
          height="74"
          rx="18"
          fill="url(#badZone)"
        />

        <line x1="66" y1="42" x2="956" y2="42" stroke="#eeeeec" />
        <line x1="66" y1="104" x2="956" y2="104" stroke="#eeeeec" />
        <line x1="66" y1="166" x2="956" y2="166" stroke="#eeeeec" />

        <text x="0" y="46" fontSize="11" fill="#9ca3af">
          Хорошо
        </text>
        <text x="0" y="108" fontSize="11" fill="#9ca3af">
          Нейтр.
        </text>
        <text x="0" y="170" fontSize="11" fill="#9ca3af">
          Плохо
        </text>

        <path
          d={chart.teamPath}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={chart.clientPath}
          fill="none"
          stroke="#111827"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.points.map((point, index) => {
          const hasMeeting = point.meetings.length > 0;
          const label = formatTick(point.date, index, chart.total);

          return (
            <g key={point.key}>
              {hasMeeting ? (
                <>
                  <line
                    x1={point.x}
                    y1="34"
                    x2={point.x}
                    y2="176"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="3 5"
                  />

                  <circle
                    cx={point.x}
                    cy={point.teamY}
                    r="4"
                    fill="#9ca3af"
                    stroke="white"
                    strokeWidth="1.5"
                  />

                  <circle
                    cx={point.x}
                    cy={point.clientY}
                    r="4.4"
                    fill="#111827"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </>
              ) : null}

              {label ? (
                <text
                  x={point.x}
                  y="214"
                  textAnchor="middle"
                  fontSize="10"
                  fill={hasMeeting ? "#111827" : "#9ca3af"}
                  fontWeight={hasMeeting ? 600 : 400}
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
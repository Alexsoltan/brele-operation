"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { type Meeting } from "@/lib/types";

type Period = "month" | "quarter" | "halfyear" | "year" | "all";
type HealthTone = "good" | "warning" | "critical";

const periodOptions: Array<{ value: Period; label: string; days?: number }> = [
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
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

function meetingImpact(meeting: Meeting) {
  let impact = 0;

  if (meeting.analysisStatus === "error") impact -= 10;

  if (meeting.risk === "high") impact -= 35;
  if (meeting.risk === "medium") impact -= 18;
  if (meeting.risk === "low") impact += 2;

  if (meeting.hasClient !== false) {
    if (meeting.clientMood === "bad") impact -= 25;
    if (meeting.clientMood === "neutral") impact -= 6;
    if (meeting.clientMood === "good") impact += 6;
  }

  if (meeting.teamMood === "bad") impact -= 20;
  if (meeting.teamMood === "neutral") impact -= 4;
  if (meeting.teamMood === "good") impact += 5;

  return impact;
}

function healthTone(score: number): HealthTone {
  if (score <= 45) return "critical";
  if (score <= 75) return "warning";
  return "good";
}

function healthLabel(score: number) {
  if (score <= 45) return "Критическое состояние";
  if (score <= 75) return "Требует внимания";
  return "Хорошее состояние";
}

function summarizeProject(meetings: Meeting[], score: number, delta: number) {
  const latest = meetings
    .filter((meeting) => meeting.analysisStatus !== "pending")
    .slice(0, 10);

  const hasHighRisk = latest.some((meeting) => meeting.risk === "high");
  const hasBadClient = latest.some(
    (meeting) => meeting.hasClient !== false && meeting.clientMood === "bad",
  );
  const hasBadTeam = latest.some((meeting) => meeting.teamMood === "bad");

  if (latest.length === 0) {
    return "Пока недостаточно проанализированных встреч, чтобы оценить динамику проекта.";
  }

  if (score <= 45) {
    return "Проект находится в зоне риска: последние встречи показывают критичные сигналы, которые требуют быстрой реакции.";
  }

  if (hasHighRisk || hasBadClient) {
    return "В проекте появились сильные негативные сигналы: стоит разобрать последние встречи и зафиксировать план действий.";
  }

  if (delta < -12 || hasBadTeam) {
    return "Динамика проекта проседает: накопились сигналы, которые требуют внимания менеджера.";
  }

  if (delta > 8) {
    return "Динамика проекта улучшается: последние встречи выглядят стабильнее, риски снижаются.";
  }

  return "Проект выглядит стабильно: критичных сигналов нет, но стоит продолжать следить за рисками и настроением команды.";
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

function buildSoftPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    const dx = current.x - previous.x;
    const curve = Math.min(28, dx * 0.48);

    path += ` C ${previous.x + curve} ${previous.y}, ${current.x - curve} ${current.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function toneStyles(tone: HealthTone) {
  if (tone === "critical") {
    return {
      card: "border-red-100 bg-red-50 text-red-800",
      icon: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      glow: "from-red-100 via-red-50 to-white",
    };
  }

  if (tone === "warning") {
    return {
      card: "border-amber-100 bg-amber-50 text-amber-800",
      icon: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      glow: "from-amber-100 via-amber-50 to-white",
    };
  }

  return {
    card: "border-green-100 bg-green-50 text-green-800",
    icon: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    glow: "from-green-100 via-green-50 to-white",
  };
}

export function ProjectHealthOverview({ meetings }: { meetings: Meeting[] }) {
  const [period, setPeriod] = useState<Period>("quarter");

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

    let score = 100;
    const total = Math.max(days.length - 1, 1);
    const startX = 72;
    const endX = 940;

    const points = days.map((day, index) => {
      const key = keyFromDate(day);
      const dayMeetings = meetingsByDay.get(key) ?? [];

      dayMeetings
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((meeting) => {
          score = clamp(score + meetingImpact(meeting));
        });

      const x = startX + (index * (endX - startX)) / total;
      const y = 34 + ((100 - score) / 100) * 142;

      return {
        key,
        date: day,
        x,
        y,
        score,
        meetings: dayMeetings,
      };
    });

    const currentScore = points.at(-1)?.score ?? 100;
    const firstScore = points[0]?.score ?? 100;
    const delta = currentScore - firstScore;

    return {
      points,
      total: days.length,
      currentScore,
      delta,
      path: buildSoftPath(points.map((point) => ({ x: point.x, y: point.y }))),
      summary: summarizeProject(meetings, currentScore, delta),
    };
  }, [meetings, period]);

  const tone = healthTone(chart.currentScore);
  const styles = toneStyles(tone);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-[-0.02em]">
            Динамика проекта
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Общая оценка проекта на основе рисков, настроения и ключевых
            сигналов
          </p>
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

      <div className="grid grid-cols-[320px_1fr] gap-5">
        <div
          className={[
            "relative min-h-[330px] overflow-hidden rounded-3xl border p-6",
            styles.card,
          ].join(" ")}
        >
          <div
            className={[
              "pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t",
              styles.glow,
            ].join(" ")}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div className={["rounded-full p-2", styles.icon].join(" ")}>
              {tone === "critical" ? (
                <AlertTriangle size={18} />
              ) : tone === "warning" ? (
                <Activity size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>

            <span className={["h-3 w-3 rounded-full", styles.dot].join(" ")} />
          </div>

          <div className="relative mt-8 font-heading text-5xl font-semibold tracking-[-0.08em]">
            {chart.currentScore}
          </div>

          <div className="relative mt-2 text-sm font-semibold">
            {healthLabel(chart.currentScore)}
          </div>

          <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/65 px-3 py-1.5 text-xs font-medium">
            {chart.delta >= 0 ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            {chart.delta >= 0 ? "+" : ""}
            {chart.delta} за период
          </div>

          <div className="relative mt-6 rounded-3xl bg-white/65 p-4 text-sm leading-6">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-55">
              AI summary проекта
            </div>

            {chart.summary}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-5">
          <svg viewBox="0 0 1000 235" className="h-72 w-full">
            <defs>
              <linearGradient id="healthGoodZone" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#dcfce7" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#dcfce7" stopOpacity="0.05" />
              </linearGradient>

              <linearGradient id="healthBadZone" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#fee2e2" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#fee2e2" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <rect
              x="66"
              y="20"
              width="890"
              height="72"
              rx="18"
              fill="url(#healthGoodZone)"
            />

            <rect
              x="66"
              y="92"
              width="890"
              height="48"
              rx="18"
              fill="#fef3c7"
              opacity="0.65"
            />

            <rect
              x="66"
              y="116"
              width="890"
              height="74"
              rx="18"
              fill="url(#healthBadZone)"
            />

            <line x1="66" y1="42" x2="956" y2="42" stroke="#eeeeec" />
            <line x1="66" y1="104" x2="956" y2="104" stroke="#eeeeec" />
            <line x1="66" y1="166" x2="956" y2="166" stroke="#eeeeec" />

            <text x="0" y="46" fontSize="11" fill="#9ca3af">
              Хорошо
            </text>

            <text x="0" y="108" fontSize="11" fill="#9ca3af">
              Средне
            </text>

            <text x="0" y="170" fontSize="11" fill="#9ca3af">
              Критично
            </text>

            <path
              d={chart.path}
              fill="none"
              stroke="#111827"
              strokeWidth="1.8"
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
                        cy={point.y}
                        r="4.5"
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
        </div>
      </div>
    </section>
  );
}
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Smile,
  Users,
} from "lucide-react";

import type { Meeting, Mood, Project } from "@/lib/types";

type Range = "week" | "month" | "quarter" | "year" | "all";

type MoodPoint = {
  id: string;
  date: string;
  clientScore: number;
  teamScore: number;
};

function moodLabel(value: Mood) {
  if (value === "good") return "Хорошо";
  if (value === "bad") return "Плохо";
  return "Нейтрально";
}

function moodScore(value: Mood) {
  if (value === "good") return 85;
  if (value === "neutral") return 60;
  return 20;
}

function moodTone(value: Mood) {
  if (value === "good") {
    return "bg-gradient-to-br from-[#c9f5d3] via-[#b7efc4] to-[#9ee6b2] text-black";
  }

  if (value === "bad") {
    return "bg-gradient-to-br from-[#ffd7d7] via-[#ffc0c0] to-[#ff9c9c] text-[#7f1d1d]";
  }

  return "bg-gradient-to-br from-[#f6ff8f] via-[#ffe98a] to-[#ffd36b] text-black";
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

  if (range === "week") date.setDate(date.getDate() - 7);
  if (range === "month") date.setMonth(date.getMonth() - 1);
  if (range === "quarter") date.setMonth(date.getMonth() - 3);
  if (range === "year") date.setFullYear(date.getFullYear() - 1);

  return date;
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
    pushTick(rangeStart);

    let cursor = nextMonday(rangeStart);

    while (cursor < rangeEnd) {
      pushTick(cursor);
      cursor = addDays(cursor, 7);
    }

    pushTick(rangeEnd);

    return ticks;
  }

  pushTick(rangeStart);

  let cursor = addMonths(startOfMonth(rangeStart), 1);

  while (cursor < rangeEnd) {
    pushTick(cursor);
    cursor = addMonths(cursor, 1);
  }

  pushTick(rangeEnd);

  return ticks;
}

function buildRangeMoodPoints(
  points: MoodPoint[],
  range: Range,
  currentClientScore: number,
  currentTeamScore: number,
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
                clientScore: currentClientScore,
                teamScore: currentTeamScore,
              },
            ],
    };
  }

  const rangeStart = getRangeStart(range, rangeEnd);

  // 👉 ВАЖНО: ищем точку ДО диапазона
  const previousPoint = [...points]
    .reverse()
    .find((point) => new Date(point.date) < rangeStart);

  const pointsInRange = points.filter((point) => {
    const date = new Date(point.date);
    return date >= rangeStart && date <= rangeEnd;
  });

  // 👉 baseline (главное исправление бага)
  const baselinePoint: MoodPoint = {
    id: "baseline",
    date: rangeStart.toISOString(),
    clientScore:
      previousPoint?.clientScore ??
      pointsInRange[0]?.clientScore ??
      currentClientScore,
    teamScore:
      previousPoint?.teamScore ??
      pointsInRange[0]?.teamScore ??
      currentTeamScore,
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

    path += ` L ${curr.x} ${prev.y}`;
    path += ` L ${curr.x} ${curr.y}`;
  }

  const last = points[points.length - 1];
  path += ` L 100 ${last.y}`;

  return path;
}

function normalizeLinePoints(
  points: MoodPoint[],
  field: "clientScore" | "teamScore",
  yOffset: number,
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
    const y = 100 - point[field] + yOffset;

    return {
      ...point,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  });
}

export function ProjectMoodV2({
  project,
  meetings,
}: {
  project: Project;
  meetings: Meeting[];
}) {
  const [range, setRange] = useState<Range>("month");

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => a.date.localeCompare(b.date));
  }, [meetings]);

  const moodPoints = useMemo(() => {
    const points = sortedMeetings.map((meeting) => ({
      id: meeting.id,
      date: meeting.date,
      clientScore: moodScore(meeting.clientMood),
      teamScore: moodScore(meeting.teamMood),
    }));

    if (points.length === 0) {
      return [
        {
          id: "current",
          date: new Date().toISOString(),
          clientScore: moodScore(project.clientMood ?? "neutral"),
          teamScore: moodScore(project.teamMood ?? "neutral"),
        },
      ];
    }

    return points;
    
  }, [project.clientMood, project.teamMood, sortedMeetings]);
  
  const latest = meetings[0];
  const previous = meetings[1];

  const clientMood = latest?.clientMood ?? project.clientMood ?? "neutral";
  const teamMood = latest?.teamMood ?? project.teamMood ?? "neutral";

  const clientCurrent = moodScore(clientMood);
  const teamCurrent = moodScore(teamMood);

  const chartData = buildRangeMoodPoints(
    moodPoints,
    range,
    clientCurrent,
    teamCurrent,
  );

  const chartMoodPoints = chartData.points;
  const rangeStart = chartData.rangeStart;
  const rangeEnd = chartData.rangeEnd;

  const dateTicks = getDateTicks(range, rangeStart, rangeEnd);

  const clientPrevious = moodScore(previous?.clientMood ?? "neutral");
  const teamPrevious = moodScore(previous?.teamMood ?? "neutral");

  const clientDelta = clientCurrent - clientPrevious;
  const teamDelta = teamCurrent - teamPrevious;

  const clientLinePoints = normalizeLinePoints(
    chartMoodPoints,
    "clientScore",
    -1.8,
    rangeStart,
    rangeEnd,
  );

  const teamLinePoints = normalizeLinePoints(
    chartMoodPoints,
    "teamScore",
    1.8,
    rangeStart,
    rangeEnd,
  );

  const clientPath = buildSvgPath(clientLinePoints);
  const teamPath = buildSvgPath(teamLinePoints);
    return (
    <section className="rounded-[34px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
      <div className="mb-4">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
          Динамика настроения
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Изменение настроения клиента и команды по встречам проекта.
        </p>
      </div>

      <div className="grid grid-cols-[190px_minmax(0,1fr)] gap-4">
        <div className="space-y-4">
          <div
            className={[
              "relative overflow-hidden rounded-[28px] p-5",
              moodTone(clientMood),
            ].join(" ")}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-2">
              <div className="text-sm font-bold">Клиент</div>
              <div className="rounded-full bg-white/45 p-2">
                <Smile size={16} />
              </div>
            </div>

            <div className="relative mt-6 flex items-start gap-2">
              <div className="font-heading text-6xl font-semibold leading-none tracking-[-0.08em]">
                {clientCurrent}
              </div>

              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold">
                {trendIcon(clientDelta)}
                {clientDelta > 0 ? `+${clientDelta}` : clientDelta}
              </div>
            </div>

            <div className="relative mt-2 text-base font-semibold">
              {moodLabel(clientMood)}
            </div>
          </div>

          <div
            className={[
              "relative overflow-hidden rounded-[28px] p-5",
              moodTone(teamMood),
            ].join(" ")}
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-2">
              <div className="text-sm font-bold">Команда</div>
              <div className="rounded-full bg-white/45 p-2">
                <Users size={16} />
              </div>
            </div>

            <div className="relative mt-6 flex items-start gap-2">
              <div className="font-heading text-6xl font-semibold leading-none tracking-[-0.08em]">
                {teamCurrent}
              </div>

              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/10 px-2.5 py-1 text-xs font-semibold">
                {trendIcon(teamDelta)}
                {teamDelta > 0 ? `+${teamDelta}` : teamDelta}
              </div>
            </div>

            <div className="relative mt-2 text-base font-semibold">
              {moodLabel(teamMood)}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-[#1f1f1f] p-4 text-white">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-white/55">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[#d9ff3f]" />
                Клиент
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-[#8f7cff]" />
                Команда
              </span>
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

          <div className="relative h-[280px] overflow-hidden rounded-[30px] bg-[#1f1f1f]">
            <div className="absolute left-6 right-6 top-[33%] h-px bg-white/10" />
            <div className="absolute left-6 right-6 top-[66%] h-px bg-white/10" />
            <div className="absolute bottom-10 left-6 right-6 h-px bg-white/12" />

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-x-6 bottom-10 top-6 h-[210px] w-[calc(100%-48px)] overflow-visible"
            >
              <path
                d={clientPath}
                fill="none"
                stroke="#d9ff3f"
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={teamPath}
                fill="none"
                stroke="#8f7cff"
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="absolute inset-x-6 bottom-10 top-6">
              {clientLinePoints.map((point) => (
                <div
                  key={`client-${point.id}`}
                  className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#d9ff3f] bg-[#1f1f1f] shadow-[0_0_0_3px_rgba(31,31,31,0.95)]"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  title={`${formatShortDate(point.date)} · Клиент ${point.clientScore}`}
                />
              ))}

              {teamLinePoints.map((point) => (
                <div
                  key={`team-${point.id}`}
                  className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#8f7cff] bg-[#1f1f1f] shadow-[0_0_0_3px_rgba(31,31,31,0.95)]"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  title={`${formatShortDate(point.date)} · Команда ${point.teamScore}`}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-6 right-6 h-5">
              {dateTicks.map((point, index) => (
                <span
                  key={`${point.id}-${index}`}
                  className={[
                    "absolute top-0 whitespace-nowrap text-[12px] text-white/35",
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
                  {formatShortDate(point.date)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
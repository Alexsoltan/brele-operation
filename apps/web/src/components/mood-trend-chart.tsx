"use client";

import { useMemo } from "react";
import {
  Smile,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { TrendZoneChart } from "@/components/trend-zone-chart";
import type { Meeting, Mood } from "@/lib/types";

function moodToScore(mood: Mood) {
  if (mood === "good") return 100;
  if (mood === "neutral") return 60;
  return 20;
}

function getTone(score: number) {
  if (score < 40) return "red";
  if (score < 70) return "yellow";
  return "green";
}

function getToneStyles(score: number) {
  const tone = getTone(score);

  if (tone === "red") {
    return {
      card: "border-red-100 bg-red-50 text-red-800",
      icon: "bg-red-100 text-red-700",
    };
  }

  if (tone === "yellow") {
    return {
      card: "border-amber-100 bg-amber-50 text-amber-800",
      icon: "bg-amber-100 text-amber-700",
    };
  }

  return {
    card: "border-green-100 bg-green-50 text-green-800",
    icon: "bg-green-100 text-green-700",
  };
}

function getScoreLabel(score: number) {
  if (score < 40) return "Плохо";
  if (score < 70) return "Нейтрально";
  return "Хорошо";
}

function calculateCurrentScore(
  meetings: Meeting[],
  field: "clientMood" | "teamMood",
) {
  const latest = meetings[0];
  if (!latest) return 60;
  return moodToScore(latest[field]);
}

function calculatePreviousScore(
  meetings: Meeting[],
  field: "clientMood" | "teamMood",
) {
  const previous = meetings[1];
  if (!previous) return calculateCurrentScore(meetings, field);
  return moodToScore(previous[field]);
}

function buildMoodSeries(
  meetings: Meeting[],
  field: "clientMood" | "teamMood",
) {
  return [...meetings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((meeting) => ({
      date: meeting.date,
      value: moodToScore(meeting[field]),
    }));
}

function MoodMiniCard({
  title,
  score,
  delta,
  icon,
}: {
  title: string;
  score: number;
  delta: number;
  icon: "client" | "team";
}) {
  const styles = getToneStyles(score);

  return (
    <div className={`rounded-3xl border p-4 ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold opacity-75">{title}</div>

          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-semibold leading-none">{score}</div>

            <div className="mb-1 flex items-center gap-1 text-xs font-semibold">
              {delta >= 0 ? (
                <TrendingUp size={13} />
              ) : (
                <TrendingDown size={13} />
              )}
              {delta >= 0 ? "+" : ""}
              {delta}
            </div>
          </div>

          <div className="mt-1 text-sm font-semibold">
            {getScoreLabel(score)}
          </div>
        </div>

        <div className={`rounded-full p-2 ${styles.icon}`}>
          {icon === "client" ? <Smile size={16} /> : <Users size={16} />}
        </div>
      </div>
    </div>
  );
}

export function MoodTrendChart({ meetings }: { meetings: Meeting[] }) {
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => b.date.localeCompare(a.date));
  }, [meetings]);

  const clientScore = calculateCurrentScore(sortedMeetings, "clientMood");
  const teamScore = calculateCurrentScore(sortedMeetings, "teamMood");

  const clientPreviousScore = calculatePreviousScore(
    sortedMeetings,
    "clientMood",
  );

  const teamPreviousScore = calculatePreviousScore(sortedMeetings, "teamMood");

  const clientDelta = clientScore - clientPreviousScore;
  const teamDelta = teamScore - teamPreviousScore;

  const clientSeries = useMemo(() => {
    return buildMoodSeries(sortedMeetings, "clientMood");
  }, [sortedMeetings]);

  const teamSeries = useMemo(() => {
    return buildMoodSeries(sortedMeetings, "teamMood");
  }, [sortedMeetings]);

  const summary = useMemo(() => {
    if (clientScore < 40 || teamScore < 40) {
      return "Настроение просело: есть негативные сигналы, стоит быстро разобраться с причинами.";
    }

    if (clientScore < 70 || teamScore < 70) {
      return "Настроение нейтральное: критичной просадки нет, но динамику стоит держать под контролем.";
    }

    return "Настроение выглядит стабильным: клиент и команда находятся в хорошем состоянии.";
  }, [clientScore, teamScore]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Динамика настроения</h2>
        <p className="text-sm text-gray-500">
          Изменение настроения клиента и команды по встречам проекта
        </p>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MoodMiniCard
              title="Клиент"
              score={clientScore}
              delta={clientDelta}
              icon="client"
            />

            <MoodMiniCard
              title="Команда"
              score={teamScore}
              delta={teamDelta}
              icon="team"
            />
          </div>

          <div className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-4 text-sm leading-6 text-gray-600">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              AI summary настроения
            </div>
            {summary}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-5 top-5 z-10 flex items-center gap-5 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#111827]" />
              Клиент
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9ca3af]" />
              Команда
            </div>
          </div>

          <TrendZoneChart
            compact
            series={[
              {
                id: "client",
                points: clientSeries,
                strokeClassName: "stroke-[#111827]",
                dotClassName: "fill-[#111827]",
              },
              {
                id: "team",
                points: teamSeries,
                strokeClassName: "stroke-[#9ca3af]",
                dotClassName: "fill-[#9ca3af]",
              },
            ]}
            eventDates={sortedMeetings.map((meeting) => meeting.date)}
            initialValue={60}
            defaultPeriod="month"
            yLabels={{
              top: "Хорошо",
              middle: "Нейтр.",
              bottom: "Плохо",
            }}
          />
        </div>
      </div>
    </section>
  );
}
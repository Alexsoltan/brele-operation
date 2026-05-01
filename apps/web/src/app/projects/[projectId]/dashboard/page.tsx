"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";
import { ProjectHealthOverview } from "@/components/project-health-overview";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";
import { formatMeetingDate } from "@/lib/types";

type Trend = "up" | "down" | "flat";

type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function moodScore(value: Mood) {
  if (value === "good") return 3;
  if (value === "neutral") return 2;
  return 1;
}

function riskScore(value: Risk) {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function getTrend(current: number, previous: number): Trend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function detectSignalType(text: string): ProjectSignal["type"] {
  const lower = text.toLowerCase();

  if (lower.includes("риск") || lower.includes("проблем")) return "risk";
  if (lower.includes("вопрос") || lower.includes("сомнен")) return "warning";
  return "opportunity";
}

function extractSignals(meetings: Meeting[]): ProjectSignal[] {
  return meetings
    .slice(0, 10)
    .flatMap((meeting) =>
      meeting.highlights.map((highlight) => ({
        text: highlight,
        type: detectSignalType(highlight),
        date: meeting.date,
      })),
    )
    .slice(0, 5);
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const [projectResponse, meetingsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/meetings?projectId=${projectId}`),
      ]);

      if (!projectResponse.ok) {
        setProject(null);
        setMeetings([]);
        return;
      }

      const projectData = (await projectResponse.json()) as Project;
      const meetingsData = (await meetingsResponse.json()) as Meeting[];

      setProject(projectData);
      setMeetings(
        meetingsData.sort((a, b) => b.date.localeCompare(a.date)),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      load();
    }
  }, [projectId]);

  const signals = useMemo(() => extractSignals(meetings), [meetings]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка...</div>;
  }

  if (!project) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Проект не найден</h1>
      </div>
    );
  }

  const currentClient = meetings[0]?.clientMood ?? project.clientMood;
  const currentTeam = meetings[0]?.teamMood ?? project.teamMood;
  const currentRisk = meetings[0]?.risk ?? project.risk;
  const prev = meetings[1];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-3 gap-4">
        <MoodSpeedometer
          title="Клиент"
          value={currentClient}
          trend={getTrend(
            moodScore(currentClient),
            moodScore(prev?.clientMood ?? "neutral"),
          )}
          trendKind="mood"
        />

        <MoodSpeedometer
          title="Команда"
          value={currentTeam}
          trend={getTrend(
            moodScore(currentTeam),
            moodScore(prev?.teamMood ?? "neutral"),
          )}
          trendKind="mood"
        />

        <MoodSpeedometer
          title="Риск"
          value={currentRisk}
          trend={getTrend(
            riskScore(currentRisk),
            riskScore(prev?.risk ?? "low"),
          )}
          trendKind="risk"
        />
      </section>

      <ProjectHealthOverview project={project} meetings={meetings} />

      <MoodTrendChart meetings={meetings} />

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Сигналы</h2>

        <div className="mt-4 space-y-3">
          {signals.length === 0 ? (
            <div className="text-sm text-gray-500">Нет значимых сигналов</div>
          ) : (
            signals.map((signal, index) => (
              <div key={index} className="rounded-xl border p-4 text-sm">
                {formatMeetingDate(signal.date)} — {signal.text}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
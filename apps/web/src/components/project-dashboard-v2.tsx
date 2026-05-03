"use client";

import { useMemo } from "react";

import { ProjectChatSummaryV2 } from "@/components/project-chat-summary-v2";
import { ProjectHealthV2 } from "@/components/project-health-v2";
import { ProjectMoodV2 } from "@/components/project-mood-v2";
import { ProjectSignalsV2 } from "@/components/project-signals-v2";
import type { Meeting, Project } from "@/lib/types";

type ProjectSignal = {
  text: string;
  type: "risk" | "warning" | "opportunity";
  date: string;
  sourceLabel: string;
};

type HealthPoint = {
  id: string;
  date: string;
  score: number;
  delta: number;
  impact: number;
};

function getMeetingSourceLabel(meeting: Meeting) {
  const typedMeeting = meeting as Meeting & {
    meetingType?: string | null;
    type?: {
      name?: string | null;
    } | null;
  };

  return typedMeeting.type?.name || typedMeeting.meetingType || "Встреча";
}

function detectSignalType(text: string): ProjectSignal["type"] {
  const lower = text.toLowerCase();

  if (
    lower.includes("риск") ||
    lower.includes("проблем") ||
    lower.includes("недовол") ||
    lower.includes("срыв")
  ) {
    return "risk";
  }

  if (
    lower.includes("вопрос") ||
    lower.includes("сомнен") ||
    lower.includes("неясн")
  ) {
    return "warning";
  }

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
          sourceLabel: getMeetingSourceLabel(meeting),
      })),
    )
    .slice(0, 6);
}

export function ProjectDashboardV2({
  project,
  meetings,
  healthPoints,
}: {
  project: Project;
  meetings: Meeting[];
  healthPoints: HealthPoint[];
}) {
  const signals = useMemo(() => extractSignals(meetings), [meetings]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_440px] gap-6">
      <main className="space-y-6">
        <ProjectHealthV2
          project={project}
          meetings={meetings}
          healthPoints={healthPoints}
        />

        <ProjectMoodV2 project={project} meetings={meetings} />
      </main>

      <aside className="space-y-5">
        <ProjectChatSummaryV2 projectId={project.id} />

        <ProjectSignalsV2 signals={signals} />
      </aside>
    </div>
  );
}
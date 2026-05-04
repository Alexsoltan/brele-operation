"use client";

import { useEffect, useState } from "react";

import { ProjectChatSummaryV2 } from "@/components/project-chat-summary-v2";
import { ProjectHealthV2 } from "@/components/project-health-v2";
import { ProjectMoodV2 } from "@/components/project-mood-v2";
import { ProjectSignalsV2 } from "@/components/project-signals-v2";
import type { Meeting, Project, ProjectSignal } from "@/lib/types";

type HealthPoint = {
  id: string;
  date: string;
  score: number;
  delta: number;
  impact: number;
};

export function ProjectDashboardV2({
  project,
  meetings,
  healthPoints,
}: {
  project: Project;
  meetings: Meeting[];
  healthPoints: HealthPoint[];
}) {
  const [signals, setSignals] = useState<ProjectSignal[]>([]);

  useEffect(() => {
    async function loadSignals() {
      const response = await fetch(`/api/projects/${project.id}/signals`);

      if (!response.ok) {
        setSignals([]);
        return;
      }

      const data = (await response.json()) as ProjectSignal[];
      setSignals(data);
    }

    loadSignals();
  }, [project.id]);

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
        <ProjectSignalsV2 signals={signals.slice(0, 6)} />
      </aside>
    </div>
  );
}
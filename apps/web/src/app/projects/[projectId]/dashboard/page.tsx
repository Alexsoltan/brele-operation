"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ProjectDashboardV2 } from "@/components/project-dashboard-v2";
import type { Meeting, Mood, Project, Risk } from "@/lib/types";

type HealthPoint = {
  id: string;
  date: string;
  score: number;
  delta: number;
  impact: number;
  meetingId?: string | null;
  risk: Risk;
  clientMood: Mood;
  teamMood: Mood;
  hasClient: boolean;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function DashboardPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [healthPoints, setHealthPoints] = useState<HealthPoint[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      const [projectResponse, meetingsResponse, healthPointsResponse] =
        await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/meetings?projectId=${projectId}`),
          fetch(`/api/projects/${projectId}/health-points`),
        ]);

      if (!projectResponse.ok) {
        setProject(null);
        setMeetings([]);
        setHealthPoints([]);
        return;
      }

      const projectData = (await projectResponse.json()) as Project;
      const meetingsData = (await meetingsResponse.json()) as Meeting[];

      setProject(projectData);
      setMeetings(meetingsData.sort((a, b) => b.date.localeCompare(a.date)));

      if (healthPointsResponse.ok) {
        const healthPointsData =
          (await healthPointsResponse.json()) as HealthPoint[];

        setHealthPoints(
          healthPointsData.sort((a, b) => a.date.localeCompare(b.date)),
        );
      } else {
        setHealthPoints([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      load();
    }
  }, [projectId]);

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

  return (
    <ProjectDashboardV2
      project={project}
      meetings={meetings}
      healthPoints={healthPoints}
    />
  );
}
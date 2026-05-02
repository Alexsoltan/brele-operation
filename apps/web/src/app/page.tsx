"use client";

import { useEffect, useMemo, useState } from "react";

import { PageTitle } from "@/components/page-title";
import { ProjectDashboardCard } from "@/components/project-dashboard-card";
import type { Meeting, Project } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetingsByProject, setMeetingsByProject] = useState<
    Record<string, Meeting[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projectsResponse, meetingsResponse] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/meetings"),
        ]);

        const projectsData = (await projectsResponse.json()) as Project[];
        const meetingsData = (await meetingsResponse.json()) as Meeting[];

        const activeProjects = projectsData.filter(
          (project) => project.status === "active",
        );

        const groupedMeetings = activeProjects.reduce<Record<string, Meeting[]>>(
          (acc, project) => {
            acc[project.id] = meetingsData
              .filter((meeting) => meeting.projectId === project.id)
              .sort((a, b) => b.date.localeCompare(a.date));

            return acc;
          },
          {},
        );

        setProjects(activeProjects);
        setMeetingsByProject(groupedMeetings);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      return (a.healthScore ?? 100) - (b.healthScore ?? 100);
    });
  }, [projects]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка дашборда...</div>;
  }

  return (
    <div className="space-y-7">
      <header>
        <PageTitle>Состояние проектов</PageTitle>

        <p className="mt-1 text-sm text-gray-500">
          Обзор активных проектов, рисков и здоровья проекта
        </p>
      </header>

      {sortedProjects.length === 0 ? (
        <section className="rounded-[34px] border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
          Активных проектов пока нет.
        </section>
      ) : (
        <section className="grid grid-cols-3 gap-5">
          {sortedProjects.map((project) => (
            <ProjectDashboardCard
              key={project.id}
              project={project}
              meetings={meetingsByProject[project.id] ?? []}
            />
          ))}
        </section>
      )}
    </div>
  );
}
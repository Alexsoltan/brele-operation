"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DashboardNotificationCenter,
  type DashboardSignalNotification,
} from "@/components/dashboard-notification-center";
import { PageTitle } from "@/components/page-title";
import { ProjectDashboardCard } from "@/components/project-dashboard-card";
import type { Meeting, Project, ProjectSignal } from "@/lib/types";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetingsByProject, setMeetingsByProject] = useState<
    Record<string, Meeting[]>
  >({});
  const [signals, setSignals] = useState<DashboardSignalNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] =
    useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;

        setProjects(activeProjects);
        setMeetingsByProject(groupedMeetings);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSignals() {
      const signalGroups = await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(`/api/projects/${project.id}/signals`);

            if (!response.ok) return [];

            const projectSignals = (await response.json()) as ProjectSignal[];

            return projectSignals.map((signal) => ({
              ...signal,
              projectName: project.name,
            }));
          } catch {
            return [];
          }
        }),
      );

      if (cancelled) return;

      setSignals(
        signalGroups
          .flat()
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
          .slice(0, 12),
      );
    }

    if (projects.length === 0) {
      setSignals([]);
      return;
    }

    loadSignals();

    return () => {
      cancelled = true;
    };
  }, [projects]);

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
      <header className="flex items-start justify-between gap-5">
        <div>
          <PageTitle>Состояние проектов</PageTitle>

          <p className="mt-1 text-sm text-gray-500">
            Обзор активных проектов, рисков и здоровья проекта
          </p>
        </div>

        <DashboardNotificationCenter
          isOpen={isNotificationCenterOpen}
          signals={signals}
          onClose={() => setIsNotificationCenterOpen(false)}
          onToggle={() =>
            setIsNotificationCenterOpen((currentValue) => !currentValue)
          }
        />
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

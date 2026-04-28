"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProjects, type Project } from "@/lib/project-store";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const stats = useMemo(() => {
    return {
      activeProjects: projects.filter((project) => project.status === "active").length,
      riskProjects: projects.filter((project) => project.risk === "high").length,
      negativeMood: projects.filter((project) => project.clientMood === "bad").length,
      noMeetings: projects.filter((project) => project.lastMeetingAt === "Нет встреч").length,
    };
  }, [projects]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="mt-1 text-sm text-gray-500">
          Обзор всех активных проектов и состояния клиентов
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Активные проекты" value={stats.activeProjects} caption="Сейчас в работе" />
        <StatCard title="В зоне риска" value={stats.riskProjects} caption="Требуют внимания" />
        <StatCard title="Негативная динамика" value={stats.negativeMood} caption="Клиент недоволен" />
        <StatCard title="Нет встреч" value={stats.noMeetings} caption="Нет зафиксированных встреч" />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Активные проекты</h2>

          <Link
            href="/projects"
            className="text-sm font-medium text-gray-500 hover:text-black"
          >
            Все проекты
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{project.name}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    Клиент: {project.clientName}
                  </div>
                </div>

                <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                  Активный
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="mb-1 text-xs text-gray-400">Клиент</div>
                  <MoodBadge mood={project.clientMood} />
                </div>

                <div>
                  <div className="mb-1 text-xs text-gray-400">Команда</div>
                  <MoodBadge mood={project.teamMood} />
                </div>

                <div>
                  <div className="mb-1 text-xs text-gray-400">Риск</div>
                  <RiskBadge risk={project.risk} />
                </div>
              </div>

              <div className="mt-5 text-xs text-gray-400">
                Последняя встреча: {project.lastMeetingAt}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{caption}</div>
    </div>
  );
}
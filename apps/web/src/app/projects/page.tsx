"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import {
  getProjects,
  updateProjectStatus,
  type Project,
  type ProjectStatus,
} from "@/lib/project-store";

const tabs: Array<{ value: ProjectStatus; label: string }> = [
  { value: "active", label: "Активные" },
  { value: "hold", label: "Холд" },
  { value: "archived", label: "Архив" },
];

function statusLabel(status: ProjectStatus) {
  if (status === "hold") return "На холде";
  if (status === "archived") return "В архиве";
  return "Активный";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<ProjectStatus>("active");

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => project.status === activeTab);
  }, [activeTab, projects]);

  function handleStatusChange(projectId: string, status: ProjectStatus) {
    const nextProjects = updateProjectStatus(projectId, status);
    setProjects(nextProjects);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="mt-1 text-sm text-gray-500">
            Все клиентские проекты и их текущее состояние
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus size={16} />
          Создать проект
        </Link>
      </div>

      {/* Tabs */}
      <section className="border-b border-gray-200">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const count = projects.filter(
              (project) => project.status === tab.value,
            ).length;

            const isActive = activeTab === tab.value;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative pb-3 text-sm font-medium transition
                  ${
                    isActive
                      ? "text-black"
                      : "text-gray-400 hover:text-black"
                  }`}
              >
                {tab.label} ({count})

                {isActive && (
                  <span className="absolute left-0 bottom-0 h-[2px] w-full bg-black rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* List */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">
            {tabs.find((t) => t.value === activeTab)?.label} проекты
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Найдено проектов: {filteredProjects.length}
          </p>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
            В этой вкладке пока нет проектов.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <Link href={`/projects/${project.id}`} className="min-w-0">
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Клиент: {project.client}
                    </p>
                  </Link>

                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                    {statusLabel(project.status)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
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
                  Последняя встреча: {project.lastMeeting}
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <label className="mb-2 block text-xs text-gray-400">
                    Статус проекта
                  </label>

                  <select
                    value={project.status}
                    onChange={(event) =>
                      handleStatusChange(
                        project.id,
                        event.target.value as ProjectStatus,
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-3 py-2.5 text-sm outline-none focus:border-black"
                  >
                    <option value="active">Активный</option>
                    <option value="hold">Холд</option>
                    <option value="archived">Архив</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
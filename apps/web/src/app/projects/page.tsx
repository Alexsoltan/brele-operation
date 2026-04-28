"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { getProjects, type Project } from "@/lib/project-store";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="mt-1 text-sm text-gray-500">
            Все клиентские проекты и их текущее состояние
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Создать проект
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm"
          >
            <div>
              <div className="font-semibold">{project.name}</div>
              <div className="mt-1 text-sm text-gray-500">
                Клиент: {project.clientName}
              </div>
            </div>

            <div className="flex gap-6 text-sm">
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

            <div className="text-xs text-gray-400">
              Последняя встреча: {project.lastMeetingAt}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
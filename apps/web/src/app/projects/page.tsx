"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type Project = {
  id: string;
  name: string;
  client: string | null;
  status: "active" | "hold" | "archived";
  clientMood: "good" | "neutral" | "bad";
  teamMood: "good" | "neutral" | "bad";
  risk: "low" | "medium" | "high";
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Загрузка проектов...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
            Проекты
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Управление проектами, состоянием команд и рисками
          </p>
        </div>

        <Link

  href="/projects/new"

  className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"

>

  <Plus size={16} />

  Добавить проект

</Link>
      </div>

      {/* LIST */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        {projects.length === 0 ? (
          <div className="text-sm text-gray-500">
            Нет проектов
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {project.name}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {project.client ?? "Клиент не указан"}
                    </div>
                  </div>

                  <div className="text-sm text-gray-400">
                    {project.status}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>Клиент: {project.clientMood}</span>
                  <span>Команда: {project.teamMood}</span>
                  <span>Риск: {project.risk}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
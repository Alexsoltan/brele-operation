"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  canManageProjects,
  type UserRole,
} from "@/lib/permissions";

type ProjectStatus = "active" | "hold" | "archived";

type Project = {
  id: string;
  name: string;
  client: string | null;
  status: ProjectStatus;
};

type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  workspaceId: string;
};

const tabs: Array<{ value: ProjectStatus; label: string }> = [
  { value: "active", label: "Активные" },
  { value: "hold", label: "Холд" },
  { value: "archived", label: "Архив" },
];

function statusLabel(status: ProjectStatus) {
  if (status === "hold") return "Холд";
  if (status === "archived") return "Архив";
  return "Активный";
}

function statusClassName(status: ProjectStatus) {
  if (status === "hold") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (status === "archived") {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }

  return "border-green-200 bg-green-50 text-green-700";
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectStatus>("active");
  const [loading, setLoading] = useState(true);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(
    null,
  );
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEditProjects = canManageProjects(currentUser?.role);

  async function loadPage() {
    setLoading(true);

    try {
      const [projectsResponse, meResponse] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/me"),
      ]);

      const projectsData = (await projectsResponse.json()) as Project[];
      const userData = (await meResponse.json()) as CurrentUser;

      setProjects(projectsData);
      setCurrentUser(userData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => project.status === activeTab);
  }, [activeTab, projects]);

  async function handleDeleteProject() {
    if (!projectToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      setProjects((current) =>
        current.filter((p) => p.id !== projectToDelete.id),
      );

      setProjectToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка проектов...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Проекты</h1>
          <p className="text-sm text-gray-500">
            Список проектов и управление
          </p>
        </div>

        {canEditProjects && (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm text-white"
          >
            <Plus size={16} />
            Добавить проект
          </Link>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 rounded-3xl border bg-white p-2">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          const count = projects.filter(
            (p) => p.status === tab.value,
          ).length;

          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                "rounded-2xl px-4 py-2 text-sm",
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100",
              ].join(" ")}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-3xl border bg-white p-6"
          >
            <div className="flex justify-between">
              <Link href={`/projects/${project.id}`}>
                <div>
                  <h2 className="font-semibold">{project.name}</h2>
                  <p className="text-sm text-gray-500">
                    {project.client ?? "Без клиента"}
                  </p>
                </div>
              </Link>

              {canEditProjects && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuProjectId(project.id)
                    }
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenuProjectId === project.id && (
                    <div className="absolute right-0 top-6 w-40 rounded-xl border bg-white shadow">
                      <button
                        className="flex w-full gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setProjectToDelete(project);
                          setOpenMenuProjectId(null);
                        }}
                      >
                        <Trash2 size={14} />
                        Удалить
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STATUS */}
            <div className="mt-4">
              {canEditProjects ? (
                <div className="relative inline-block">
                  <button
                    onClick={() =>
                      setOpenMenuProjectId(
                        `status-${project.id}`,
                      )
                    }
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
                      statusClassName(project.status),
                    ].join(" ")}
                  >
                    {statusLabel(project.status)}
                    <ChevronDown size={12} />
                  </button>

                  {openMenuProjectId ===
                    `status-${project.id}` && (
                    <div className="absolute top-7 w-40 rounded-xl border bg-white shadow">
                      {tabs.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={async () => {
                            setOpenMenuProjectId(null);

                            setProjects((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, status: tab.value }
                                  : p,
                              ),
                            );

                            await fetch(
                              `/api/projects/${project.id}`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type":
                                    "application/json",
                                },
                                body: JSON.stringify({
                                  status: tab.value,
                                }),
                              },
                            );
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {statusLabel(tab.value)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-xs",
                    statusClassName(project.status),
                  ].join(" ")}
                >
                  {statusLabel(project.status)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DELETE MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-6">
            <p>
              Удалить проект "{projectToDelete.name}"?
            </p>

            <div className="mt-4 flex gap-2">
              <button onClick={() => setProjectToDelete(null)}>
                Отмена
              </button>

              <button
                onClick={handleDeleteProject}
                className="text-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
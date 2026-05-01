"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Settings } from "lucide-react";

import { Tabs } from "@/components/ui-tabs";
import { PageTitle } from "@/components/page-title";
import { ProjectSettingsModal } from "@/components/project-settings-modal";

import type { Project } from "@/lib/types";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type Tab = "dashboard" | "meetings" | "chats" | "settings";

const tabConfig = [
  { key: "dashboard", label: "Дашборд проекта" },
  { key: "meetings", label: "Встречи" },
  { key: "chats", label: "Чаты" },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const projectId = normalizeParam(params?.projectId);

  // ✅ ВСЕ STATE ДОЛЖНЫ БЫТЬ ТУТ
  const [project, setProject] = useState<Project | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) return;

      const data = await res.json();
      setProject(data);
    }

    if (projectId) load();
  }, [projectId]);

  function getCurrentTab(): Tab {
    if (pathname.includes("/meetings")) return "meetings";
    if (pathname.includes("/chats")) return "chats";
    return "dashboard";
  }

  function handleTabChange(tab: string) {
    router.push(`/projects/${projectId}/${tab}`);
  }
    return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <PageTitle>{project?.name ?? "Загрузка..."}</PageTitle>

          <div className="mt-1 text-sm text-gray-500">
            {project?.client ?? "Клиент не указан"}
          </div>
        </div>

        {/* SETTINGS BUTTON + MODAL */}
        <div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <Settings size={16} />
            Настройки
          </button>

          <ProjectSettingsModal
            projectId={projectId}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      </div>

      {/* TABS */}
      <Tabs
        value={getCurrentTab()}
        onChange={handleTabChange}
        items={tabConfig}
      />

      {/* CONTENT */}
      <div>{children}</div>
    </div>
  );
}
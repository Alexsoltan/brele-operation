"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import type { Meeting, Project } from "@/lib/types";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function ProjectMeetingsPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);

  async function loadProjectAndMeetings() {
    setLoading(true);

    try {
      const [projectResponse, meetingsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/meetings?projectId=${projectId}`),
      ]);

      if (!projectResponse.ok) {
        setProject(null);
        setMeetings([]);
        return;
      }

      const projectData = (await projectResponse.json()) as Project;
      const meetingsData = meetingsResponse.ok
        ? ((await meetingsResponse.json()) as Meeting[])
        : [];

      setProject(projectData);
      setMeetings(meetingsData.sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }

  async function reloadMeetingsOnly() {
    const response = await fetch(`/api/meetings?projectId=${projectId}`);

    if (!response.ok) return;

    const data = (await response.json()) as Meeting[];
    setMeetings(data.sort((a, b) => b.date.localeCompare(a.date)));
  }

  useEffect(() => {
    if (projectId) {
      loadProjectAndMeetings();
    }
  }, [projectId]);
    if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Загрузка встреч...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Проект не найден
      </div>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
              Встречи
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Все встречи проекта
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddMeetingOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={16} />
            Добавить встречу
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
            Нет встреч
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                hideProjectName
              />
            ))}
          </div>
        )}
      </section>

      <AddMeetingModal
        isOpen={isAddMeetingOpen}
        onClose={() => setIsAddMeetingOpen(false)}
        onMeetingsChange={reloadMeetingsOnly}
        initialProjectId={project.id}
        projects={[project]}
      />
    </>
  );
}
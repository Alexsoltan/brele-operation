"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { AddMeetingModal } from "@/components/add-meeting-modal";
import { MeetingCard } from "@/components/meeting-card";
import { PageTitle } from "@/components/page-title";
import { PrimaryActionButton } from "@/components/primary-action-button";
import { UiSelect } from "@/components/ui-select";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";

type Meeting = {
  id: string;
  projectId: string;
  meetingTypeId?: string | null;
  title: string;
  date: string;
  meetingType: string;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  analysisStatus: "pending" | "analyzed" | "manual" | "error";
  project?: {
    id: string;
    name: string;
  };
  type?: {
    id: string;
    name: string;
  } | null;
};

type Project = {
  id: string;
  name: string;
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [moodFilter, setMoodFilter] = useState<"all" | Mood>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | Risk>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meetingsRes, projectsRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/projects"),
        ]);

        const meetingsData = await meetingsRes.json();
        const projectsData = await projectsRes.json();

        setMeetings(meetingsData);
        setProjects(projectsData);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      if (projectFilter !== "all" && meeting.projectId !== projectFilter) {
        return false;
      }

      if (moodFilter !== "all" && meeting.clientMood !== moodFilter) {
        return false;
      }

      if (riskFilter !== "all" && meeting.risk !== riskFilter) {
        return false;
      }

      if (query.trim()) {
        const q = query.toLowerCase();

        return (
          meeting.title.toLowerCase().includes(q) ||
          meeting.summary.toLowerCase().includes(q) ||
          meeting.project?.name.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [meetings, projectFilter, moodFilter, riskFilter, query]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Загрузка встреч...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Встречи</PageTitle>

          <p className="mt-1 text-sm text-gray-500">
            Все встречи, AI-анализ и сигналы по проектам
          </p>
        </div>

        <PrimaryActionButton
          onClick={() => setIsModalOpen(true)}
          icon={<Plus size={16} />}
        >
          Добавить встречу
        </PrimaryActionButton>
      </div>

      <section className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr] items-start gap-3">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по встречам"
            className="h-[50px] w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition hover:border-gray-300 focus:border-black"
          />
        </div>

        <UiSelect
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "all", label: "Все проекты" },
            ...projects.map((project) => ({
              value: project.id,
              label: project.name,
            })),
          ]}
        />

        <UiSelect
          value={moodFilter}
          onChange={(value) => setMoodFilter(value as "all" | Mood)}
          options={[
            { value: "all", label: "Все настроения" },
            { value: "good", label: "Хорошо" },
            { value: "neutral", label: "Нейтрально" },
            { value: "bad", label: "Плохо" },
          ]}
        />

        <UiSelect
          value={riskFilter}
          onChange={(value) => setRiskFilter(value as "all" | Risk)}
          options={[
            { value: "all", label: "Все риски" },
            { value: "low", label: "Низкий" },
            { value: "medium", label: "Средний" },
            { value: "high", label: "Высокий" },
          ]}
        />
      </section>

      <section className="space-y-3">
        {filteredMeetings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
            Встречи не найдены.
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))
        )}
      </section>

      <AddMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMeetingsChange={setMeetings}
        projects={projects}
      />
    </div>
  );
}
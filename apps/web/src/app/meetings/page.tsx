"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { UiSelect } from "@/components/ui-select";
import { MeetingCard } from "@/components/meeting-card";
import { AddMeetingModal } from "@/components/add-meeting-modal";
import { PageTitle } from "@/components/page-title";
import { Plus } from "lucide-react";
import { PrimaryActionButton } from "@/components/primary-action-button";

type Mood = "good" | "neutral" | "bad";
type Risk = "low" | "medium" | "high";

type Meeting = {
  id: string;
  projectId: string;
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
      } catch (e) {
        console.error(e);
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
          meeting.summary.toLowerCase().includes(q)
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
      {/* HEADER */}
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

      {/* FILTERS */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr] items-start gap-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по встречам"
              className="h-[50px] w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] py-3 pl-11 pr-4 text-sm outline-none focus:border-black"
            />
          </div>

          <UiSelect
            value={projectFilter}
            onChange={setProjectFilter}
            options={[
              { value: "all", label: "Все проекты" },
              ...projects.map((p) => ({
                value: p.id,
                label: p.name,
              })),
            ]}
          />

          <UiSelect
            value={moodFilter}
            onChange={(v) => setMoodFilter(v as any)}
            options={[
              { value: "all", label: "Все настроения" },
              { value: "good", label: "Хорошо" },
              { value: "neutral", label: "Нейтрально" },
              { value: "bad", label: "Плохо" },
            ]}
          />

          <UiSelect
            value={riskFilter}
            onChange={(v) => setRiskFilter(v as any)}
            options={[
              { value: "all", label: "Все риски" },
              { value: "low", label: "Низкий" },
              { value: "medium", label: "Средний" },
              { value: "high", label: "Высокий" },
            ]}
          />
        </div>
      </section>

      {/* LIST */}
      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold">
            История встреч
          </h2>

          <div className="mt-1 text-sm text-gray-500">
            Найдено: {filteredMeetings.length}
          </div>
        </div>

        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
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
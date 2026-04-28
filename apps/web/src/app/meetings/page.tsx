"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { formatMeetingDate, getMeetings, type Meeting } from "@/lib/meeting-store";
import { getProjects, type Project } from "@/lib/project-store";
import type { Mood, Risk } from "@/lib/mock-data";

const moodOptions: Array<{ value: "all" | Mood; label: string }> = [
  { value: "all", label: "Все настроения" },
  { value: "good", label: "Хорошо" },
  { value: "neutral", label: "Нейтрально" },
  { value: "bad", label: "Плохо" },
];

const riskOptions: Array<{ value: "all" | Risk; label: string }> = [
  { value: "all", label: "Все риски" },
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [moodFilter, setMoodFilter] = useState<"all" | Mood>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | Risk>("all");

  useEffect(() => {
    setMeetings(getMeetings());
    setProjects(getProjects());
  }, []);

  const projectById = useMemo(() => {
    return new Map(projects.map((project) => [project.id, project]));
  }, [projects]);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return meetings
      .filter((meeting) => {
        const project = projectById.get(meeting.projectId);
        const projectName = project?.name ?? "";

        const matchesSearch =
          !normalizedQuery ||
          meeting.title.toLowerCase().includes(normalizedQuery) ||
          meeting.summary.toLowerCase().includes(normalizedQuery) ||
          projectName.toLowerCase().includes(normalizedQuery);

        const matchesProject =
          projectFilter === "all" || meeting.projectId === projectFilter;

        const matchesMood =
          moodFilter === "all" || meeting.clientMood === moodFilter;

        const matchesRisk =
          riskFilter === "all" || meeting.risk === riskFilter;

        return matchesSearch && matchesProject && matchesMood && matchesRisk;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [meetings, moodFilter, projectById, projectFilter, query, riskFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Встречи</h1>
        <p className="mt-1 text-sm text-gray-500">
          Все встречи по проектам, AI-оценки, риски и динамика коммуникации
        </p>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr] gap-3">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по встречам, summary или проекту"
              className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] py-3 pl-11 pr-4 text-sm outline-none focus:border-black"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          >
            <option value="all">Все проекты</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={moodFilter}
            onChange={(event) => setMoodFilter(event.target.value as "all" | Mood)}
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          >
            {moodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value as "all" | Risk)}
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          >
            {riskOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">История встреч</h2>
            <p className="mt-1 text-sm text-gray-500">
              Найдено встреч: {filteredMeetings.length}
            </p>
          </div>
        </div>

        {filteredMeetings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-[#f3f3f1] p-8 text-sm text-gray-500">
            Встречи не найдены. Попробуй изменить поиск или фильтры.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const project = projectById.get(meeting.projectId);
              const highlights = Array.isArray(meeting.highlights)
                ? meeting.highlights
                : [];

              return (
                <Link
                  key={meeting.id}
                  href={`/projects/${meeting.projectId}`}
                  className="block rounded-3xl border border-gray-200 bg-[#f3f3f1] p-5 transition hover:border-gray-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-500">
                        {project?.name ?? meeting.projectId}
                      </div>

                      <h3 className="mt-1 font-semibold">{meeting.title}</h3>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <CalendarDays size={14} />
                        {formatMeetingDate(meeting.date)}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <MoodBadge mood={meeting.clientMood} />
                      <RiskBadge risk={meeting.risk} />
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
                    {meeting.summary}
                  </p>

                  {highlights.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {highlights.slice(0, 3).map((highlight, index) => (
                        <span
                          key={`${meeting.id}-${index}`}
                          className="rounded-full bg-white px-3 py-1 text-xs text-gray-500"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
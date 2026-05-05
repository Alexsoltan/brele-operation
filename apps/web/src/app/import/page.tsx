"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { PrimaryActionButton } from "@/components/primary-action-button";
import { UiDatePicker, getLocalDateInputValue } from "@/components/ui-date-picker";
import { UiSelect } from "@/components/ui-select";

type Draft = {
  id: string;
  status: "new" | "linked" | "ignored" | "error";
  sourceEmail: string;
  fromEmail?: string | null;
  emailSubject: string;
  emailDate?: string | null;
  attachmentFileName: string;
  telemostMeetingUrl?: string | null;
  transcriptText: string;
  manager?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
};

type Project = {
  id: string;
  name: string;
};

type MeetingType = {
  id: string;
  name: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Дата письма не указана";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DraftCard({
  draft,
  projects,
  meetingTypes,
  onChanged,
}: {
  draft: Draft;
  projects: Project[];
  meetingTypes: MeetingType[];
  onChanged: () => void;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [meetingTypeId, setMeetingTypeId] = useState(meetingTypes[0]?.id ?? "");
  const [date, setDate] = useState(() =>
    draft.emailDate ? draft.emailDate.slice(0, 10) : getLocalDateInputValue(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const preview = useMemo(
    () => draft.transcriptText.replace(/\s+/g, " ").slice(0, 320),
    [draft.transcriptText],
  );

  useEffect(() => {
    if (!projectId && projects[0]?.id) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    if (!meetingTypeId && meetingTypes[0]?.id) {
      setMeetingTypeId(meetingTypes[0].id);
    }
  }, [meetingTypeId, meetingTypes]);

  async function handleLink() {
    if (!projectId || !meetingTypeId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/import/meeting-drafts/${draft.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          meetingTypeId,
          date,
        }),
      });

      if (!response.ok) throw new Error("Draft link failed");

      onChanged();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleIgnore() {
    await fetch(`/api/import/meeting-drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ignored" }),
    });
    onChanged();
  }

  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{draft.attachmentFileName}</div>
          <div className="mt-1 text-xs text-gray-500">
            {draft.emailSubject} · {formatDate(draft.emailDate)}
          </div>
          {draft.manager ? (
            <div className="mt-1 text-xs text-gray-500">
              Менеджер: {draft.manager.name ?? draft.manager.email}
            </div>
          ) : null}
        </div>

        {draft.telemostMeetingUrl ? (
          <a
            href={draft.telemostMeetingUrl}
            target="_blank"
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
          >
            Телемост
          </a>
        ) : null}
      </div>

      <p className="mt-4 rounded-2xl bg-[#f3f3f1] p-4 text-sm leading-6 text-gray-700">
        {preview}
        {draft.transcriptText.length > preview.length ? "..." : ""}
      </p>

      <div className="mt-4 grid grid-cols-[1fr_1fr_160px_auto_auto] items-end gap-3">
        <UiSelect
          label="Проект"
          value={projectId}
          onChange={setProjectId}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
        />

        <UiSelect
          label="Тип встречи"
          value={meetingTypeId}
          onChange={setMeetingTypeId}
          options={meetingTypes.map((type) => ({
            value: type.id,
            label: type.name,
          }))}
        />

        <UiDatePicker label="Дата" value={date} onChange={setDate} />

        <button
          type="button"
          onClick={handleIgnore}
          className="inline-flex h-[50px] items-center gap-2 rounded-2xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          <X size={16} />
          Скрыть
        </button>

        <button
          type="button"
          onClick={handleLink}
          disabled={isSubmitting || !projectId || !meetingTypeId}
          className="inline-flex h-[50px] items-center gap-2 rounded-2xl bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Разобрать
        </button>
      </div>
    </article>
  );
}

export default function ImportPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  async function load() {
    const [draftsRes, projectsRes, typesRes] = await Promise.all([
      fetch("/api/import/meeting-drafts?status=new", { cache: "no-store" }),
      fetch("/api/projects", { cache: "no-store" }),
      fetch("/api/meeting-types", { cache: "no-store" }),
    ]);

    if (draftsRes.ok) setDrafts(await draftsRes.json());
    if (projectsRes.ok) setProjects(await projectsRes.json());
    if (typesRes.ok) setMeetingTypes(await typesRes.json());
  }

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, []);

  async function handleSync() {
    setIsSyncing(true);

    try {
      await fetch("/api/import/sync", {
        method: "POST",
      });
      await load();
    } finally {
      setIsSyncing(false);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Загрузка импорта...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Импорт встреч</PageTitle>
          <p className="mt-1 text-sm text-gray-500">
            Входящие TXT-конспекты из Яндекс Телемоста
          </p>
        </div>

        <PrimaryActionButton
          onClick={handleSync}
          icon={
            isSyncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )
          }
        >
          Проверить почту
        </PrimaryActionButton>
      </div>

      <section className="space-y-3">
        {drafts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
            Новых входящих встреч нет.
          </div>
        ) : (
          drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              projects={projects}
              meetingTypes={meetingTypes}
              onChanged={load}
            />
          ))
        )}
      </section>
    </div>
  );
}

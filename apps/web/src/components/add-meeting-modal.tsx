"use client";

import { useEffect, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Upload, X } from "lucide-react";

import {
  getLocalDateInputValue,
  UiDatePicker,
} from "@/components/ui-date-picker";
import { UiSelect } from "@/components/ui-select";

type Project = {
  id: string;
  name: string;
};

type MeetingType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt: string;
  isDefault: boolean;
  hasClient: boolean;
};

type Meeting = {
  id: string;
  projectId: string;
  meetingTypeId?: string | null;
  title: string;
  date: string;
  meetingType: string;
  hasClient: boolean;
  summary: string;
  highlights: string[];
  clientMood: "good" | "neutral" | "bad";
  teamMood: "good" | "neutral" | "bad";
  risk: "low" | "medium" | "high";
  analysisStatus: "pending" | "analyzed" | "manual" | "error";
  project?: Project;
};

type AddMeetingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMeetingsChange: (meetings: Meeting[]) => void;
  initialProjectId?: string;
  projects?: Project[];
};

export function AddMeetingModal({
  isOpen,
  onClose,
  onMeetingsChange,
  initialProjectId,
  projects = [],
}: AddMeetingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [projectId, setProjectId] = useState(
    initialProjectId ?? projects[0]?.id ?? "",
  );
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [meetingTypeId, setMeetingTypeId] = useState("");
  const [date, setDate] = useState(() => getLocalDateInputValue());
  const [transcriptText, setTranscriptText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMeetingType = meetingTypes.find(
    (type) => type.id === meetingTypeId,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadMeetingTypes() {
      const response = await fetch("/api/meeting-types");

      if (!response.ok) {
        setMeetingTypes([]);
        setMeetingTypeId("");
        return;
      }

      const data = (await response.json()) as MeetingType[];

      setMeetingTypes(data);

      const defaultType = data.find((type) => type.isDefault) ?? data[0];

      if (defaultType) {
        setMeetingTypeId(defaultType.id);
      }
    }

    if (isOpen) {
      loadMeetingTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
      return;
    }

    if (!projectId && projects[0]?.id) {
      setProjectId(projects[0].id);
    }
  }, [initialProjectId, projectId, projects]);

  if (!isOpen || !mounted) return null;

  async function reloadMeetings() {
    const response = await fetch("/api/meetings");

    if (!response.ok) return;

    const meetings = await response.json();
    onMeetingsChange(meetings);
  }

  async function readFile(file: File) {
    const text = await file.text();
    setFileName(file.name);
    setTranscriptText(text);
  }

  async function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await readFile(file);
    }
  }

  async function handleCreateMeeting() {
    if (!projectId || !meetingTypeId || !transcriptText.trim()) return;

    setIsSubmitting(true);

    const transcript = transcriptText.trim();
    const typeName = selectedMeetingType?.name ?? "Встреча";
    const typeSlug = selectedMeetingType?.slug ?? "meeting";
    const hasClient = selectedMeetingType?.hasClient ?? true;

    try {
      const createResponse = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          meetingTypeId,
          title: typeName,
          date,
          meetingType: typeSlug,
          hasClient,
          transcriptText: transcript,
          summary: "AI-анализ встречи выполняется...",
          highlights: [],
          clientMood: "neutral",
          teamMood: "neutral",
          risk: "low",
          analysisStatus: "pending",
          modelName: "",
          analyzedAt: null,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Meeting creation failed");
      }

      await reloadMeetings();
      onClose();

      setTranscriptText("");
      setFileName("");
      setDate(getLocalDateInputValue());
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-black/35 px-6 py-8 backdrop-blur-[1px]">
      <div className="max-h-[calc(100vh-64px)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">
              Добавить встречу
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Выбери проект, тип встречи и добавь транскрибацию. После
              сохранения запустится AI-анализ.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 items-end gap-3">
          <UiSelect
            label="Проект"
            value={projectId}
            onChange={setProjectId}
            disabled={projects.length === 1}
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
        </div>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={[
            "mt-4 block cursor-pointer rounded-3xl border border-dashed p-5 text-center transition",
            isDragging
              ? "border-black bg-gray-100"
              : "border-gray-200 bg-[#f3f3f1] hover:border-gray-300",
          ].join(" ")}
        >
          <Upload className="mx-auto text-gray-400" size={24} />

          <div className="mt-2 text-sm font-medium">
            Загрузить TXT-файл или перетащить сюда
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {fileName ? fileName : "Также можно вставить текст вручную ниже"}
          </div>

          <input
            type="file"
            accept=".txt,text/plain"
            onChange={async (event) => {
              const file = event.target.files?.[0];

              if (file) {
                await readFile(file);
              }
            }}
            className="hidden"
          />
        </label>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-medium text-gray-500">
            Транскрибация
          </span>

          <textarea
            value={transcriptText}
            onChange={(event) => {
              setTranscriptText(event.target.value);
              if (fileName) setFileName("");
            }}
            placeholder="Вставь текст транскрибации встречи..."
            rows={10}
            className="w-full resize-none rounded-3xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none focus:border-black"
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleCreateMeeting}
            disabled={
              isSubmitting ||
              !projectId ||
              !meetingTypeId ||
              !transcriptText.trim()
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Добавить и запустить AI-анализ
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

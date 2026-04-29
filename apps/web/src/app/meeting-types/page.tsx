"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageTitle } from "@/components/page-title";
import { PrimaryActionButton } from "@/components/primary-action-button";

type MeetingType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt: string;
  isDefault: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  prompt: "",
};

const scrollAreaClassName =
  "[scrollbar-width:thin] [scrollbar-color:#c7c7c3_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-gray-400";

export default function MeetingTypesPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<MeetingType | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const selectedType = useMemo(
    () => meetingTypes.find((type) => type.id === selectedId) ?? null,
    [meetingTypes, selectedId],
  );

  async function loadMeetingTypes(nextSelectedId?: string | null) {
    setLoading(true);

    try {
      const response = await fetch("/api/meeting-types", { cache: "no-store" });
      const data = (await response.json()) as MeetingType[];

      setMeetingTypes(data);

      if (data.length === 0) {
        setSelectedId(null);
        setForm(emptyForm);
        return;
      }

      const current =
        data.find((type) => type.id === nextSelectedId) ??
        data.find((type) => type.id === selectedId) ??
        data[0];

      setSelectedId(current.id);
      setForm({
        name: current.name,
        description: current.description ?? "",
        prompt: current.prompt,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetingTypes();
  }, []);

  function selectType(type: MeetingType) {
    setSelectedId(type.id);
    setForm({
      name: type.name,
      description: type.description ?? "",
      prompt: type.prompt,
    });
  }

  function createDraft() {
    setSelectedId(null);
    setForm(emptyForm);
  }

  async function saveType() {
    if (!form.name.trim() || !form.prompt.trim()) return;

    setSaving(true);

    try {
      const response = await fetch(
        selectedType
          ? `/api/meeting-types/${selectedType.id}`
          : "/api/meeting-types",
        {
          method: selectedType ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            prompt: form.prompt.trim(),
          }),
        },
      );

      if (!response.ok) {
        alert("Не удалось сохранить тип встречи");
        return;
      }

      const saved = (await response.json()) as MeetingType;
      await loadMeetingTypes(saved.id);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteType() {
    if (!deleteCandidate) return;

    setDeleting(true);

    try {
      const deletedId = deleteCandidate.id;

      const response = await fetch(`/api/meeting-types/${deletedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        alert(error?.error || error?.details || "Не удалось удалить тип встречи");
        return;
      }

      setDeleteCandidate(null);

      const nextSelected =
        selectedId === deletedId
          ? meetingTypes.find((type) => type.id !== deletedId)?.id ?? null
          : selectedId;

      await loadMeetingTypes(nextSelected);
    } finally {
      setDeleting(false);
    }
  }

  async function suggestPrompt() {
    if (!form.name.trim()) return;

    setSuggesting(true);

    try {
      const response = await fetch("/api/meeting-types/suggest-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
        }),
      });

      if (!response.ok) {
        alert("Не удалось предложить prompt");
        return;
      }

      const data = (await response.json()) as { prompt: string };

      setForm((current) => ({
        ...current,
        prompt: data.prompt,
      }));
    } finally {
      setSuggesting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Загрузка типов встреч...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Типы встреч</PageTitle>

          <p className="mt-1 text-sm text-gray-500">
            Справочник типов встреч и AI-промпты
          </p>
        </div>

        <PrimaryActionButton onClick={createDraft} icon={<Plus size={16} />}>
          Добавить тип
        </PrimaryActionButton>
      </div>

      <div className="grid grid-cols-[380px_1fr] gap-5">
        <section className="space-y-3">
          {meetingTypes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm leading-6 text-gray-500">
              Типов встреч пока нет. Создай первый тип и добавь prompt для
              AI-анализа.
            </div>
          ) : (
            meetingTypes.map((type) => {
              const isActive = type.id === selectedId;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => selectType(type)}
                  className={[
                    "w-full rounded-3xl border p-5 text-left transition",
                    isActive
                      ? "border-black bg-black text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:shadow-sm",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-heading text-base font-semibold">
                      {type.name}
                    </div>

                    {type.isDefault ? (
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs",
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-gray-100 text-gray-500",
                        ].join(" ")}
                      >
                        default
                      </span>
                    ) : null}
                  </div>

                  <div
                    className={[
                      "mt-2 line-clamp-2 text-sm leading-5",
                      isActive ? "text-white/70" : "text-gray-500",
                    ].join(" ")}
                  >
                    {type.description || "Описание не указано"}
                  </div>
                </button>
              );
            })
          )}
        </section>

        <section className="flex max-h-[calc(100vh-180px)] flex-col rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex-1 space-y-5 overflow-hidden">
            <label className="block space-y-2">
              <span className="text-xs font-medium text-gray-500">
                Название
              </span>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Например: Демо"
                className="h-[50px] w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none transition focus:border-black"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-medium text-gray-500">
                Описание
              </span>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Коротко опиши, для чего нужен этот тип встречи"
                rows={3}
                className={[
                  "w-full resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none transition focus:border-black",
                  scrollAreaClassName,
                ].join(" ")}
              />
            </label>

            <label className="flex min-h-0 flex-1 flex-col space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-500">
                  Prompt
                </span>

                <button
                  type="button"
                  onClick={suggestPrompt}
                  disabled={suggesting || !form.name.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                  {suggesting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Предложить через AI
                </button>
              </div>

              <textarea
                value={form.prompt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    prompt: event.target.value,
                  }))
                }
                placeholder="Опиши, как AI должен анализировать встречи этого типа"
                className={[
                  "min-h-[260px] flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none transition focus:border-black",
                  scrollAreaClassName,
                ].join(" ")}
              />
            </label>
          </div>

          <div className="mt-5 flex shrink-0 items-center justify-between border-t border-gray-100 pt-5">
            <div>
              {selectedType ? (
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(selectedType)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Удалить
                </button>
              ) : null}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedType) {
                    selectType(selectedType);
                  } else {
                    setForm(emptyForm);
                  }
                }}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Сбросить
              </button>

              <PrimaryActionButton
                onClick={saveType}
                disabled={saving || !form.name.trim() || !form.prompt.trim()}
              >
                {saving ? "Сохраняем..." : "Сохранить"}
              </PrimaryActionButton>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Удалить тип встречи?"
        description={
          <>
            Тип «{deleteCandidate?.name}» будет удалён из справочника. Встречи с
            этим типом останутся в системе, но будут отвязаны от него.
          </>
        }
        isLoading={deleting}
        onClose={() => {
          if (!deleting) setDeleteCandidate(null);
        }}
        onConfirm={confirmDeleteType}
      />
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Search, Sparkles, Trash2, Video } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { UIModal } from "@/components/ui-modal";

type MeetingType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  prompt: string;
  isDefault: boolean;
  hasClient: boolean;
  createdAt: string;
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  prompt: string;
  hasClient: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  prompt: "",
  hasClient: true,
};

const scrollAreaClassName =
  "[scrollbar-width:thin] [scrollbar-color:#c7c7c3_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb:hover]:bg-gray-400";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function sortMeetingTypes(items: MeetingType[]) {
  return [...items].sort((left, right) => {
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function clientPillClassName(hasClient: boolean) {
  return hasClient
    ? "bg-[#d9ff3f] text-black"
    : "bg-gray-100 text-gray-600";
}

export default function MeetingTypesPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<MeetingType | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  async function loadMeetingTypes() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/meeting-types", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Не удалось загрузить типы встреч");
      }

      const data = (await response.json()) as MeetingType[];
      setMeetingTypes(sortMeetingTypes(Array.isArray(data) ? data : []));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Не удалось загрузить типы встреч",
      );
      setMeetingTypes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetingTypes();
  }, []);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return meetingTypes;

    return meetingTypes.filter((item) => {
      return (
        item.name.toLowerCase().includes(search) ||
        item.slug.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search)
      );
    });
  }, [meetingTypes, query]);

  function openCreateModal() {
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(item: MeetingType) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      prompt: item.prompt,
      hasClient: item.hasClient,
    });
    setError(null);
    setModalOpen(true);
  }

  async function saveType() {
    if (!form.name.trim() || !form.prompt.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        form.id ? `/api/meeting-types/${form.id}` : "/api/meeting-types",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            prompt: form.prompt.trim(),
            hasClient: form.hasClient,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось сохранить тип встречи");
      }

      const saved = (await response.json()) as MeetingType;

      setMeetingTypes((current) => {
        const exists = current.some((item) => item.id === saved.id);

        if (exists) {
          return sortMeetingTypes(
            current.map((item) => (item.id === saved.id ? saved : item)),
          );
        }

        return sortMeetingTypes([...current, saved]);
      });

      setModalOpen(false);
      setForm(emptyForm);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Не удалось сохранить тип встречи",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteType() {
    if (!deleteCandidate) return;

    setDeleting(true);
    setError(null);

    try {
      const deletedId = deleteCandidate.id;
      const response = await fetch(`/api/meeting-types/${deletedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.error || data?.details || "Не удалось удалить тип встречи",
        );
      }

      setMeetingTypes((current) =>
        current.filter((item) => item.id !== deletedId),
      );
      setDeleteCandidate(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить тип встречи",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function suggestPrompt() {
    if (!form.name.trim()) return;

    setSuggesting(true);
    setError(null);

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
        throw new Error("Не удалось предложить prompt");
      }

      const data = (await response.json()) as { prompt: string };

      setForm((current) => ({
        ...current,
        prompt: data.prompt,
      }));
    } catch (suggestError) {
      setError(
        suggestError instanceof Error
          ? suggestError.message
          : "Не удалось предложить prompt",
      );
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex h-6 items-center rounded-full bg-[#d9ff3f] px-3 text-xs font-bold text-black">
              Meeting dictionary
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Типы встреч
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Справочник типов встреч и AI-промптов. Тип определяет правила
              анализа и влияет на то, учитывается ли настроение клиента.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d9ff3f]"
          >
            <Plus size={16} />
            Добавить тип
          </button>
        </div>
      </section>

      <section className="rounded-[34px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию, slug или описанию"
              className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] pl-10 pr-4 text-sm outline-none transition focus:border-black"
            />
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#7f1d1d]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[26px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            Загружаем типы встреч...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-gray-200 bg-[#fbfbfa] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9ff3f] text-black">
              <Video size={22} />
            </div>

            <h3 className="text-lg font-semibold text-gray-950">
              Типов встреч пока нет
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Создай первый тип и добавь prompt для AI-анализа встреч.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-gray-200">
            <div className="grid grid-cols-[1.35fr_0.9fr_0.75fr_0.75fr_90px] bg-[#f3f3f1] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <div>Тип встречи</div>
              <div>Slug</div>
              <div>Клиент</div>
              <div>Создан</div>
              <div className="text-right">Действия</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.35fr_0.9fr_0.75fr_0.75fr_90px] items-center px-4 py-4 transition hover:bg-[#fbfbfa]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-950">
                        {item.name}
                      </div>

                      {item.isDefault ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                          default
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 line-clamp-1 text-xs text-gray-400">
                      {item.description || "Описание не добавлено"}
                    </div>
                  </div>

                  <div className="font-mono text-xs text-gray-500">
                    {item.slug}
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        clientPillClassName(item.hasClient),
                      ].join(" ")}
                    >
                      {item.hasClient ? "С клиентом" : "Без клиента"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </div>

                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(item)}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-[#ffd7d7] hover:text-[#7f1d1d]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <UIModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Редактировать тип встречи" : "Добавить тип встречи"}
        width="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">
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
                className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
              />
            </label>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500">
                Участие клиента
              </span>

              <div className="grid h-12 grid-cols-2 rounded-2xl bg-[#f3f3f1] p-1">
                {[
                  [true, "С клиентом"],
                  [false, "Без клиента"],
                ].map(([value, label]) => {
                  const isActive = form.hasClient === value;

                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          hasClient: Boolean(value),
                        }))
                      }
                      className={[
                        "rounded-xl text-sm font-semibold transition",
                        isActive
                          ? "bg-black text-white"
                          : "text-gray-500 hover:bg-white hover:text-black",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-gray-500">
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

          <label className="block space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-gray-500">Prompt</span>

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
                "min-h-[260px] w-full resize-none overflow-y-auto rounded-2xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none transition focus:border-black",
                scrollAreaClassName,
              ].join(" ")}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-[#ffd7d7] bg-[#fff5f5] px-4 py-3 text-sm font-medium text-[#7f1d1d]">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={saveType}
              disabled={saving || !form.name.trim() || !form.prompt.trim()}
              className="rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {saving ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </div>
      </UIModal>

      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Удалить тип встречи?"
        description={
          <>
            Тип{" "}
            <span className="font-semibold text-gray-950">
              {deleteCandidate?.name}
            </span>{" "}
            будет удален из справочника. Встречи с этим типом останутся в
            системе, но будут отвязаны от него.
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

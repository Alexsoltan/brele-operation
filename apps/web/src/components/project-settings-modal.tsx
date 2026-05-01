"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, MessageCircle, Plus, Trash2, X } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
};

type ProjectChat = {
  id: string;
  title: string | null;
  telegramChatId: string;
  isActive: boolean;
};

type ProjectResponse = {
  id: string;
  status?: ProjectStatus;
};

const statusOptions: Array<{ value: ProjectStatus; label: string; description: string }> = [
  {
    value: "active",
    label: "Активный",
    description: "Проект в работе, сигналы учитываются в дашборде.",
  },
  {
    value: "hold",
    label: "Холд",
    description: "Проект временно на паузе.",
  },
  {
    value: "archived",
    label: "Архив",
    description: "Проект завершён или скрыт из активной работы.",
  },
];

export function ProjectSettingsModal({ projectId, isOpen, onClose }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<ProjectStatus>("active");
  const [chatTitle, setChatTitle] = useState("");
  const [chatId, setChatId] = useState("");
  const [chats, setChats] = useState<ProjectChat[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProject() {
    const response = await fetch(`/api/projects/${projectId}`);

    if (!response.ok) return;

    const project = (await response.json()) as ProjectResponse;
    setStatus(project.status ?? "active");
  }

  async function loadChats() {
    const response = await fetch(`/api/projects/${projectId}/telegram-chats`);

    if (!response.ok) return;

    const data = (await response.json()) as ProjectChat[];
    setChats(data.filter((chat) => chat.isActive !== false));
  }

  async function load() {
    setLoading(true);

    try {
      await Promise.all([loadProject(), loadChats()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && projectId) {
      load();
    }
  }, [isOpen, projectId]);

  async function addChat() {
    const telegramChatId = chatId.trim();
    const title = chatTitle.trim();

    if (!telegramChatId) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/telegram-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramChatId,
          title,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Не удалось добавить чат");
        return;
      }

      setChatId("");
      setChatTitle("");
      await loadChats();
    } finally {
      setSaving(false);
    }
  }

  async function removeChat(id: string) {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/telegram-chats/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Не удалось отключить чат");
        return;
      }

      await loadChats();
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Не удалось сохранить настройки");
        return;
      }

      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    const confirmed = window.confirm(
      "Удалить проект? Это действие скроет проект из списка. Встречи и связанные данные останутся в базе.",
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Не удалось удалить проект");
        return;
      }

      onClose();
      router.push("/projects");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleChatKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addChat();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[36px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-gray-100 px-8 py-7">
          <div>
            <h2 className="font-heading text-3xl font-semibold tracking-[-0.05em] text-gray-950">
              Настройки проекта
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Управляй статусом проекта, подключёнными Telegram-чатами и
              опасными действиями.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-950"
          >
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-8 py-7">
          {loading ? (
            <div className="rounded-3xl border border-gray-100 bg-[#f7f7f4] p-6 text-sm text-gray-500">
              Загружаю настройки...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-[28px] border border-gray-200 bg-[#fbfbfa] p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-gray-950">
                    Статус проекта
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Статус помогает отделять активные проекты от замороженных и
                    архивных.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {statusOptions.map((option) => {
                    const active = status === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={[
                          "rounded-3xl border p-4 text-left transition",
                          active
                            ? "border-black bg-black text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                        ].join(" ")}
                      >
                        <div className="text-sm font-semibold">
                          {option.label}
                        </div>
                        <div
                          className={[
                            "mt-2 text-xs leading-5",
                            active ? "text-white/65" : "text-gray-500",
                          ].join(" ")}
                        >
                          {option.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-gray-200 bg-[#fbfbfa] p-5">
                <div className="mb-5 flex items-start justify-between gap-5">
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-gray-950">
                      Telegram чаты
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      Подключи один или несколько проектных чатов. Бот будет
                      слушать сообщения и собирать сигналы по клиенту, команде и
                      рискам.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black p-3 text-white">
                    <MessageCircle size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_1.2fr_auto] gap-3">
                  <input
                    value={chatTitle}
                    onChange={(event) => setChatTitle(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Название чата"
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                  />

                  <input
                    value={chatId}
                    onChange={(event) => setChatId(event.target.value)}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Telegram Chat ID, например -5147956854"
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                  />

                  <button
                    type="button"
                    onClick={addChat}
                    disabled={saving || !chatId.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    <Plus size={16} />
                    Добавить
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {chats.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5">
                      <div className="text-sm font-semibold text-gray-900">
                        Пока нет подключённых чатов
                      </div>
                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        Добавь Telegram Chat ID. После первых сообщений
                        участники появятся во вкладке «Чаты».
                      </p>
                    </div>
                  ) : (
                    chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between gap-5 rounded-3xl border border-gray-100 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-gray-950">
                              {chat.title || "Telegram чат"}
                            </div>
                            <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-semibold text-lime-700">
                              активен
                            </span>
                          </div>

                          <div className="mt-1 font-mono text-xs text-gray-500">
                            {chat.telegramChatId}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeChat(chat.id)}
                          disabled={saving}
                          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          Отключить
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-red-100 bg-red-50 p-5">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex gap-3">
                    <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                      <AlertTriangle size={20} />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-red-950">
                        Danger zone
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-red-800/70">
                        Удаление скроет проект из активного списка. Используй
                        только если проект больше не нужен.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={saving}
                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Удалить проект
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:bg-gray-300"
          >
            {saving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
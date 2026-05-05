"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, MessageCircle, Sparkles } from "lucide-react";

import { formatMeetingDate } from "@/lib/types";

type ParticipantRole = "client" | "team" | "ignore" | "unknown";

type Participant = {
  id: string;
  name: string | null;
  username: string | null;
  role: ParticipantRole;
};

type ChatSummary = {
  id: string;
  date: string;
  summary: string;
  highlights: string[];
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function participantDisplayName(participant: Participant) {
  return (
    participant.name ||
    (participant.username ? `@${participant.username}` : "Без имени")
  );
}

function roleLabel(role: ParticipantRole) {
  if (role === "client") return "Клиент";
  if (role === "team") return "Команда";
  if (role === "ignore") return "Игнор";
  return "Выбрать";
}

function sortParticipants(participants: Participant[]) {
  return [...participants].sort((a, b) =>
    participantDisplayName(a).localeCompare(participantDisplayName(b), "ru"),
  );
}

function ParticipantSection({
  label,
  participants,
  onRoleChange,
}: {
  label?: string;
  participants: Participant[];
  onRoleChange: (id: string, role: ParticipantRole) => void;
}) {
  if (participants.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center gap-2 px-1 pt-1">
          <div className="h-px flex-1 bg-gray-200" />
          <div className="text-[11px] font-medium text-gray-400">{label}</div>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      ) : null}

      {participants.map((participant) => {
        const name = participantDisplayName(participant);

        return (
          <div
            key={participant.id}
            className="flex items-center gap-3 rounded-2xl bg-[#fbfbfa] px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-950">
                {name}
              </div>
              {participant.username ? (
                <div className="truncate text-xs text-gray-400">
                  @{participant.username}
                </div>
              ) : null}
            </div>

            <select
              value={participant.role}
              onChange={(event) =>
                onRoleChange(participant.id, event.target.value as ParticipantRole)
              }
              className="h-9 shrink-0 rounded-xl border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-black"
            >
              {(["unknown", "client", "team", "ignore"] as ParticipantRole[]).map(
                (role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ),
              )}
            </select>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectChatsPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  type Chat = {
  id: string;
  title: string | null;
  telegramChatId: string;
  };

  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [summariesResponse, participantsResponse, chatsResponse] = await Promise.all([
      fetch(`/api/projects/${projectId}/chats`),
      fetch(`/api/projects/${projectId}/chat-participants`),
      fetch(`/api/projects/${projectId}/telegram-chats`),
    ]);

    if (chatsResponse.ok) {
      setChats(await chatsResponse.json());
    }

    if (summariesResponse.ok) {
      setSummaries(await summariesResponse.json());
    }

    if (participantsResponse.ok) {
      setParticipants(await participantsResponse.json());
    }

    setLoading(false);
  }

  useEffect(() => {
    if (projectId) {
      load();
    }
  }, [projectId]);

  async function updateRole(id: string, role: ParticipantRole) {
    await fetch(`/api/projects/${projectId}/chat-participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id ? { ...participant, role } : participant,
      ),
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Загрузка чатов...
      </div>
    );
  }

  const participantsByRole = {
    unknown: sortParticipants(
      participants.filter((participant) => participant.role === "unknown"),
    ),
    client: sortParticipants(
      participants.filter((participant) => participant.role === "client"),
    ),
    team: sortParticipants(
      participants.filter((participant) => participant.role === "team"),
    ),
    ignore: sortParticipants(
      participants.filter((participant) => participant.role === "ignore"),
    ),
  };

    return (
    <div className="grid grid-cols-[1fr_340px] gap-6">
      <main className="space-y-5">
        <section className="rounded-[32px] border border-gray-200 bg-white p-6">
          <div className="mb-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#fbfbfa] px-3 py-1 text-xs font-medium text-gray-500">
                <Sparkles size={13} />
                AI summary
              </div>

              <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.04em] text-gray-950">
                Саммари чатов
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Ежедневная выжимка по всем Telegram-чатам проекта: настроение
                клиента, состояние команды, риски и важные события.
              </p>
            </div>

          </div>

          {summaries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-[#fbfbfa] p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-gray-400">
                  <MessageCircle size={20} />
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-950">
                    Пока нет дневных саммари
                  </div>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Когда в проектных чатах накопятся сообщения, ежедневный
                    анализ создаст summary за день.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {summaries.map((summary) => (
                <article
                  key={summary.id}
                  className="rounded-[26px] border border-gray-200 bg-white p-4"
                >
                  <div className="mb-1 text-xs font-semibold text-gray-500">
                    {formatMeetingDate(summary.date)}
                  </div>

                  <p className="text-sm leading-5 text-gray-700">
                    {summary.summary}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>


<aside className="space-y-4">

  {/* === ЧАТЫ ПРОЕКТА === */}
  <div className="rounded-[28px] border border-gray-200 bg-white p-5">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-black p-2 text-white">
        <MessageCircle size={16} />
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-950">
          Чаты проекта
        </div>
        <div className="text-xs text-gray-500">
          Подключённые Telegram-чаты
        </div>
      </div>
    </div>

    <div className="mt-4 space-y-2">
      {chats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
          Чаты не подключены
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            className="rounded-2xl border border-gray-100 bg-[#fbfbfa] px-4 py-3"
          >
            <div className="text-sm font-medium text-gray-950">
              {chat.title || "Без названия"}
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* === УЧАСТНИКИ ЧАТОВ === */}
  <div className="rounded-[28px] border border-gray-200 bg-white p-5">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-black p-2 text-white">
        <AlertTriangle size={17} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-950">
          Участники чатов
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          Отметь, кто клиент, кто команда, а кого нужно игнорировать при анализе.
        </p>
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
          Участники появятся после первых сообщений.
        </div>
      ) : (
        <>
          <ParticipantSection
            participants={participantsByRole.unknown}
            onRoleChange={updateRole}
          />
          <ParticipantSection
            label="Клиент"
            participants={participantsByRole.client}
            onRoleChange={updateRole}
          />
          <ParticipantSection
            label="Команда"
            participants={participantsByRole.team}
            onRoleChange={updateRole}
          />
          <ParticipantSection
            label="Игнор"
            participants={participantsByRole.ignore}
            onRoleChange={updateRole}
          />
        </>
      )}
    </div>
  </div>

</aside>
     
    </div>
  );
}

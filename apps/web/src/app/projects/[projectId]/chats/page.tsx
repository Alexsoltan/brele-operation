"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, MessageCircle, Sparkles } from "lucide-react";

import type { Mood, Risk } from "@/lib/types";
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
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
};

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function moodLabel(value: Mood) {
  if (value === "good") return "Хорошее";
  if (value === "bad") return "Плохое";
  return "Нейтральное";
}

function riskLabel(value: Risk) {
  if (value === "high") return "Высокий";
  if (value === "medium") return "Средний";
  return "Низкий";
}

function riskClassName(value: Risk) {
  if (value === "high") return "bg-red-50 text-red-700 border-red-100";
  if (value === "medium") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-green-50 text-green-700 border-green-100";
}

export default function ProjectChatsPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [summariesResponse, participantsResponse] = await Promise.all([
      fetch(`/api/projects/${projectId}/chats`),
      fetch(`/api/projects/${projectId}/chat-participants`),
    ]);

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

  const latestSummary = summaries[0];
    return (
    <div className="grid grid-cols-[1fr_340px] gap-6">
      <main className="space-y-5">
        <section className="rounded-[32px] border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-5">
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

            {latestSummary ? (
              <div
                className={[
                  "rounded-2xl border px-3 py-2 text-xs font-semibold",
                  riskClassName(latestSummary.risk),
                ].join(" ")}
              >
                Риск: {riskLabel(latestSummary.risk)}
              </div>
            ) : null}
          </div>

          {!latestSummary ? (
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
            <div className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-5">
              <div className="mb-3 text-xs font-medium text-gray-400">
                {formatMeetingDate(latestSummary.date)}
              </div>

              <p className="text-sm leading-7 text-gray-700">
                {latestSummary.summary}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-gray-400">Клиент</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">
                    {moodLabel(latestSummary.clientMood)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-gray-400">Команда</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">
                    {moodLabel(latestSummary.teamMood)}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-gray-400">Риск</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">
                    {riskLabel(latestSummary.risk)}
                  </div>
                </div>
              </div>
                            {latestSummary.highlights.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Важное за день
                  </div>

                  <div className="space-y-2">
                    {latestSummary.highlights.map((highlight, index) => (
                      <div
                        key={`${highlight}-${index}`}
                        className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-gray-700"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-gray-200 bg-white p-6">
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
            Архив summary
          </h3>

          <div className="mt-4 space-y-3">
            {summaries.length <= 1 ? (
              <div className="text-sm text-gray-500">
                Архив появится после нескольких дней анализа.
              </div>
            ) : (
              summaries.slice(1).map((summary) => (
                <div
                  key={summary.id}
                  className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-xs font-medium text-gray-400">
                      {formatMeetingDate(summary.date)}
                    </div>

                    <div
                      className={[
                        "rounded-full border px-2 py-1 text-[11px] font-semibold",
                        riskClassName(summary.risk),
                      ].join(" ")}
                    >
                      {riskLabel(summary.risk)}
                    </div>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-gray-600">
                    {summary.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <aside className="h-fit rounded-[32px] border border-gray-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-black p-2 text-white">
            <AlertTriangle size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-950">
              Участники чатов
            </h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Отметь, кто клиент, кто команда, а кого нужно игнорировать при
              анализе.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {participants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              Участники появятся после первых сообщений.
            </div>
          ) : (
            participants.map((participant) => {
              const name =
                participant.name ||
                (participant.username ? `@${participant.username}` : "Без имени");

              return (
                <div
                  key={participant.id}
                  className="rounded-3xl border border-gray-100 bg-[#fbfbfa] p-3"
                >
                  <div className="min-w-0 text-sm font-medium text-gray-950">
                    <div className="truncate">{name}</div>
                    {participant.username ? (
                      <div className="truncate text-xs font-normal text-gray-400">
                        @{participant.username}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-1">
                    {(["client", "team", "ignore"] as ParticipantRole[]).map(
                      (role) => {
                        const active = participant.role === role;

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => updateRole(participant.id, role)}
                            className={[
                              "rounded-xl border px-2 py-1.5 text-xs font-medium transition",
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-black",
                            ].join(" ")}
                          >
                            {role === "client"
                              ? "Клиент"
                              : role === "team"
                                ? "Команда"
                                : "Игнор"}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
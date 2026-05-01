"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Participant = {
  id: string;
  name: string | null;
  username: string | null;
  role: "client" | "team" | "ignore" | "unknown";
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

export default function ProjectChatsPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [summaries, setSummaries] = useState<ChatSummary[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
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

  async function updateRole(id: string, role: Participant["role"]) {
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
    return <div className="p-6 text-sm text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6">
      <div className="space-y-4">
        {summaries.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Пока нет сигналов из чатов
          </div>
        ) : (
          summaries.map((item) => (
            <div
              key={item.id}
              className="space-y-3 rounded-3xl border border-gray-200 bg-white p-6"
            >
              <div className="text-xs text-gray-400">{item.date}</div>

              <div className="text-sm font-semibold">{item.summary}</div>

              <ul className="space-y-1 text-sm text-gray-600">
                {item.highlights.map((highlight, index) => (
                  <li key={`${highlight}-${index}`}>• {highlight}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold">Участники</h2>

        <div className="mt-4 space-y-3">
          {participants.length === 0 ? (
            <div className="text-sm text-gray-500">
              Участники появятся после первых сообщений в привязанном чате
            </div>
          ) : (
            participants.map((participant) => {
              const name =
                participant.name ||
                (participant.username ? `@${participant.username}` : "Без имени");

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 text-sm">
                    <div className="truncate">{name}</div>
                    {participant.username ? (
                      <div className="truncate text-xs text-gray-400">
                        @{participant.username}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    {(["client", "team", "ignore"] as Participant["role"][]).map(
                      (role) => {
                        const active = participant.role === role;

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => updateRole(participant.id, role)}
                            className={[
                              "rounded-lg border px-2 py-1 text-xs transition",
                              active
                                ? "border-black bg-black text-white"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300",
                            ].join(" ")}
                          >
                            {role === "client"
                              ? "C"
                              : role === "team"
                                ? "T"
                                : "I"}
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
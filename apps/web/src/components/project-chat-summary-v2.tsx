"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import type { Mood, Risk } from "@/lib/types";
import { formatMeetingDate } from "@/lib/types";

type ChatSummary = {
  id: string;
  date: string;
  summary: string;
  highlights: string[];
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
};

function riskLabel(value: Risk) {
  if (value === "high") return "Высокий риск";
  if (value === "medium") return "Средний риск";
  return "Низкий риск";
}

export function ProjectChatSummaryV2({ projectId }: { projectId: string }) {
  const [latestSummary, setLatestSummary] = useState<ChatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const response = await fetch(`/api/projects/${projectId}/chats`);

        if (!response.ok) {
          setLatestSummary(null);
          return;
        }

        const data = (await response.json()) as ChatSummary[];
        setLatestSummary(data[0] ?? null);
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      load();
    }
  }, [projectId]);

  return (
    <section className="rounded-[32px] bg-[#1f1f1f] p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#d9ff3f] p-2 text-black">
          <MessageCircle size={17} />
        </div>

        <div>
          <h2 className="text-sm font-semibold">
            Последнее summary чатов
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-[24px] border border-white/10 p-4 text-sm text-white/45">
          Загружаем summary...
        </div>
      ) : latestSummary ? (
        <div className="mt-4 rounded-[26px] bg-white/8 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-white/40">
            <span>{formatMeetingDate(latestSummary.date)}</span>
            <span>{riskLabel(latestSummary.risk)}</span>
          </div>

          <p className="mt-3 line-clamp-6 text-sm leading-6 text-white/70">
            {latestSummary.summary}
          </p>

          {latestSummary.highlights.length > 0 ? (
            <div className="mt-4 space-y-2">
              {latestSummary.highlights.slice(0, 2).map((highlight, index) => (
                <div
                  key={`${highlight}-${index}`}
                  className="rounded-2xl bg-white/8 px-3 py-2 text-xs leading-5 text-white/60"
                >
                  {highlight}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-white/10 p-4 text-sm leading-6 text-white/45">
          Summary чатов пока нет.
        </div>
      )}
    </section>
  );
}
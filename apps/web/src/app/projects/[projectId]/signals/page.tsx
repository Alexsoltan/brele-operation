"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  MessageCircle,
  Plus,
  User,
} from "lucide-react";

import { formatMeetingDate } from "@/lib/types";
import type { ProjectSignal } from "@/lib/types";
import { AddProjectSignalModal } from "@/components/add-project-signal-modal";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function sourceLabel(source: ProjectSignal["source"]) {
  if (source === "chat") return "Чат";
  if (source === "manual") return "Ручной";
  return "Встреча";
}

function SourceIcon({ source }: { source: ProjectSignal["source"] }) {
  if (source === "chat") return <MessageCircle size={13} />;
  if (source === "manual") return <User size={13} />;
  return <Bot size={13} />;
}

function severityTone(severity: ProjectSignal["severity"]) {
  if (severity === "critical" || severity === "high") {
    return "bg-[#ffd7d7] text-[#7f1d1d]";
  }

  if (severity === "medium") {
    return "bg-[#fff3a3] text-[#6f5200]";
  }

  return "bg-[#c9f5d3] text-[#1f5f34]";
}

function signalTypeLabel(type: ProjectSignal["type"]) {
  const labels: Record<ProjectSignal["type"], string> = {
    client_satisfaction: "Клиент доволен",
    client_dissatisfaction: "Клиент недоволен",
    client_trust: "Доверие клиента",
    team_confidence: "Уверенность команды",
    team_demotivation: "Демотивация команды",
    deadline_risk: "Риск сроков",
    scope_change: "Изменение объёма",
    quality_issue: "Проблема качества",
    blocker: "Блокер",
    budget_risk: "Риск бюджета",
    communication_gap: "Проблема коммуникации",
    decision_made: "Решение принято",
    escalation: "Эскалация",
    positive_feedback: "Позитивный фидбек",
    upsell_opportunity: "Upsell возможность",
  };

  return labels[type] ?? type;
}

function severityLabel(severity: ProjectSignal["severity"]) {
  if (severity === "critical") return "Критично";
  if (severity === "high") return "Высокий";
  if (severity === "medium") return "Средний";
  if (severity === "low") return "Низкий";
  return "Инфо";
}

export default function ProjectSignalsPage() {
  const params = useParams();
  const projectId = normalizeParam(params?.projectId);

  const [signals, setSignals] = useState<ProjectSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadSignals() {
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/signals`);

      if (!response.ok) {
        setSignals([]);
        return;
      }

      const data = (await response.json()) as ProjectSignal[];
      setSignals(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) {
      loadSignals();
    }
  }, [projectId]);

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[34px] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex items-start justify-between gap-5">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
                Сигналы проекта
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Автоматические и ручные сигналы из встреч, чатов и менеджера.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Добавить сигнал
            </button>
          </div>

          {loading ? (
            <div className="rounded-[24px] border border-dashed border-gray-200 p-5 text-sm text-gray-500">
              Загружаем сигналы...
            </div>
          ) : signals.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-gray-200 p-5 text-sm text-gray-500">
              Сигналов пока нет.
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal) => (
                <article
                  key={signal.id}
                  className="rounded-[26px] border border-gray-200 bg-white p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      {formatMeetingDate(signal.occurredAt)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                      <SourceIcon source={signal.source} />
                      {sourceLabel(signal.source)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d9ff3f] px-2.5 py-1 text-xs font-semibold text-black">
                      {signalTypeLabel(signal.type)}
                    </span>

                    <span
                      className={[
                        "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        severityTone(signal.severity),
                      ].join(" ")}
                    >
                      <AlertTriangle size={12} />
                      {severityLabel(signal.severity)}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-950">
                    {signal.title}
                  </h3>

                  <p className="mt-2 text-sm leading-5 text-gray-700">
                    {signal.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ✅ МОДАЛКА */}
      <AddProjectSignalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onCreated={loadSignals}
      />
    </>
  );
}
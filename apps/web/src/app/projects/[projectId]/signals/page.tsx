"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";

import { formatMeetingDate } from "@/lib/types";
import type { ProjectSignal } from "@/lib/types";
import { AddProjectSignalModal } from "@/components/add-project-signal-modal";

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function signalCardTone(direction: ProjectSignal["direction"]) {
  if (direction === "positive") {
    return "border-[#bdeec6] bg-[linear-gradient(135deg,#f1fff4_0%,#ffffff_66%)]";
  }

  if (direction === "negative") {
    return "border-[#ffd7d7] bg-[linear-gradient(135deg,#fff1f1_0%,#ffffff_68%)]";
  }

  return "border-gray-200 bg-white";
}

function isHighRiskSignal(signal: ProjectSignal) {
  return signal.severity === "critical" || signal.severity === "high";
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
              {signals.map((signal) => {
                const highRisk = isHighRiskSignal(signal);

                return (
                  <article
                    key={signal.id}
                    className={[
                      "relative rounded-[26px] border p-4 pr-14",
                      signalCardTone(signal.direction),
                    ].join(" ")}
                  >
                    <div className="mb-1">
                      <span className="text-xs font-semibold text-gray-500">
                        {formatMeetingDate(signal.occurredAt)}
                      </span>

                      {highRisk ? (
                        <span className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ffd7d7] text-[#7f1d1d]">
                          <AlertTriangle size={14} />
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm leading-5 text-gray-700">
                      {signal.text}
                    </p>
                  </article>
                );
              })}
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

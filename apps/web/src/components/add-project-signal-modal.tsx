"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { UIModal } from "@/components/ui-modal";
import { UiSelect } from "@/components/ui-select";
import type {
  SignalCategory,
  SignalDirection,
  SignalSeverity,
  SignalType,
} from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: () => void;
};

const signalTypeOptions: Array<{ value: SignalType; label: string }> = [
  { value: "client_satisfaction", label: "Клиент доволен" },
  { value: "client_dissatisfaction", label: "Клиент недоволен" },
  { value: "client_trust", label: "Доверие клиента" },
  { value: "team_confidence", label: "Уверенность команды" },
  { value: "team_demotivation", label: "Демотивация команды" },
  { value: "deadline_risk", label: "Риск сроков" },
  { value: "scope_change", label: "Изменение объёма" },
  { value: "quality_issue", label: "Проблема качества" },
  { value: "blocker", label: "Блокер" },
  { value: "budget_risk", label: "Риск бюджета" },
  { value: "communication_gap", label: "Проблема коммуникации" },
  { value: "decision_made", label: "Решение принято" },
  { value: "escalation", label: "Эскалация" },
  { value: "positive_feedback", label: "Позитивный фидбек" },
  { value: "upsell_opportunity", label: "Upsell возможность" },
];

const directionOptions: Array<{ value: SignalDirection; label: string }> = [
  { value: "negative", label: "Негатив" },
  { value: "neutral", label: "Нейтрально" },
  { value: "positive", label: "Позитив" },
];

const severityOptions: Array<{ value: SignalSeverity; label: string }> = [
  { value: "info", label: "Инфо" },
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критичный" },
];

function getCategoryByType(type: SignalType): SignalCategory {
  if (
    type === "client_satisfaction" ||
    type === "client_dissatisfaction" ||
    type === "client_trust"
  ) {
    return "client";
  }

  if (type === "team_confidence" || type === "team_demotivation") {
    return "team";
  }

  if (
    type === "deadline_risk" ||
    type === "scope_change" ||
    type === "quality_issue" ||
    type === "blocker"
  ) {
    return "delivery";
  }

  if (type === "budget_risk") {
    return "business";
  }

  if (type === "communication_gap" || type === "escalation") {
    return "communication";
  }

  if (type === "decision_made") {
    return "process";
  }

  return "opportunity";
}

export function AddProjectSignalModal({
  isOpen,
  onClose,
  projectId,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [type, setType] = useState<SignalType>("communication_gap");
  const [direction, setDirection] = useState<SignalDirection>("neutral");
  const [severity, setSeverity] = useState<SignalSeverity>("medium");

  async function handleSubmit() {
    if (!text.trim()) return;

    const res = await fetch(`/api/projects/${projectId}/signals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim() || text.trim().slice(0, 80),
        text: text.trim(),
        category: getCategoryByType(type),
        type,
        direction,
        severity,
        occurredAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) return;

    setTitle("");
    setText("");
    setType("communication_gap");
    setDirection("neutral");
    setSeverity("medium");

    onClose();
    onCreated();
  }

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      title="Новый сигнал"
      width="md"
    >
      <div className="space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Заголовок"
          className="h-[50px] w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
        />

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Описание сигнала"
          rows={6}
          className="w-full resize-none rounded-2xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none transition placeholder:text-gray-400 focus:border-black"
        />

        <UiSelect
          label="Тип сигнала"
          value={type}
          onChange={(value) => setType(value as SignalType)}
          options={signalTypeOptions}
        />

        <UiSelect
          label="Направление"
          value={direction}
          onChange={(value) => setDirection(value as SignalDirection)}
          options={directionOptions}
        />

        <UiSelect
          label="Критичность"
          value={severity}
          onChange={(value) => setSeverity(value as SignalSeverity)}
          options={severityOptions}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Send size={16} />
          Сохранить сигнал
        </button>
      </div>
    </UIModal>
  );
}
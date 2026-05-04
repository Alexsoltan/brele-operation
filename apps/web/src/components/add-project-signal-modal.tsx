"use client";

import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";

import { UIModal } from "@/components/ui-modal";
import { UiSelect } from "@/components/ui-select";
import type {
  SignalDirection,
  SignalSeverity,
  SignalTypeConfig,
} from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: () => void;
};

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

export function AddProjectSignalModal({
  isOpen,
  onClose,
  projectId,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [signalTypes, setSignalTypes] = useState<SignalTypeConfig[]>([]);
  const [typeKey, setTypeKey] = useState("");
  const [direction, setDirection] = useState<SignalDirection>("neutral");
  const [severity, setSeverity] = useState<SignalSeverity>("medium");

  const signalTypeOptions = useMemo(
    () =>
      signalTypes.map((item) => ({
        value: item.key,
        label: item.label,
      })),
    [signalTypes],
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadSignalTypes() {
      const response = await fetch("/api/signal-types");

      if (!response.ok) return;

      const data = (await response.json()) as SignalTypeConfig[];
      const items = Array.isArray(data) ? data : [];

      if (cancelled) return;

      setSignalTypes(items);

      if (items.length > 0 && !items.some((item) => item.key === typeKey)) {
        const first = items[0];

        setTypeKey(first.key);
        setDirection(first.direction);
        setSeverity(first.isHighRisk ? "high" : "medium");
      }
    }

    loadSignalTypes();

    return () => {
      cancelled = true;
    };
  }, [isOpen, typeKey]);

  function selectType(nextTypeKey: string) {
    const item = signalTypes.find((signalType) => signalType.key === nextTypeKey);

    setTypeKey(nextTypeKey);

    if (item) {
      setDirection(item.direction);
      setSeverity(item.isHighRisk ? "high" : "medium");
    }
  }

  async function handleSubmit() {
    if (!text.trim() || !typeKey) return;

    const res = await fetch(`/api/projects/${projectId}/signals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim() || text.trim().slice(0, 80),
        text: text.trim(),
        typeKey,
        direction,
        severity,
        occurredAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) return;

    setTitle("");
    setText("");
    setTypeKey(signalTypes[0]?.key ?? "");
    setDirection(signalTypes[0]?.direction ?? "neutral");
    setSeverity(signalTypes[0]?.isHighRisk ? "high" : "medium");

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
          value={typeKey}
          onChange={selectType}
          options={signalTypeOptions}
          disabled={signalTypeOptions.length === 0}
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
          disabled={!text.trim() || !typeKey}
          className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Send size={16} />
          Сохранить сигнал
        </button>
      </div>
    </UIModal>
  );
}

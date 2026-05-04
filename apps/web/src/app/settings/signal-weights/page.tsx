"use client";

import { useEffect, useState } from "react";

import type {
  SignalWeightConfig,
} from "@/lib/types";

type Item = SignalWeightConfig;

export default function SignalWeightsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/signal-weights")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
  }, []);

  function updateItem(
    id: string,
    field: "weight" | "clientMoodImpact" | "teamMoodImpact",
    value: number,
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);

    const res = await fetch("/api/signal-weights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    alert(`Пересчитано проектов: ${data.recalculatedProjects}`);

    setSaving(false);
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Загрузка…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Веса сигналов
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Управление влиянием сигналов на здоровье проекта и настроение.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="mb-2 grid grid-cols-[1fr_120px_120px_120px] gap-4 px-4 text-center text-xs font-medium text-gray-400">
          <div className="text-left">Сигнал</div>
          <div>Здоровье проекта</div>
          <div>Клиент</div>
          <div>Команда</div>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_120px_120px_120px] items-center gap-4 rounded-2xl border border-gray-100 bg-[#fbfbfa] p-4"
            >
              {/* Описание */}
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {item.label ?? item.type}
                </div>

              <div className="mt-1 text-xs text-gray-400">
                {item.type}
              </div>
              </div>

              {/* Health */}
              <input
                type="number"
                value={item.weight}
                onChange={(e) =>
                  updateItem(item.id, "weight", Number(e.target.value))
                }
                className="rounded-2xl border border-gray-200 px-3 py-2 text-right text-sm"
                placeholder="Health"
              />

              {/* Client mood */}
              <input
                type="number"
                value={item.clientMoodImpact}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "clientMoodImpact",
                    Number(e.target.value),
                  )
                }
                className="rounded-2xl border border-gray-200 px-3 py-2 text-right text-sm"
                placeholder="Client"
              />

              {/* Team mood */}
              <input
                type="number"
                value={item.teamMoodImpact}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    "teamMoodImpact",
                    Number(e.target.value),
                  )
                }
                className="rounded-2xl border border-gray-200 px-3 py-2 text-right text-sm"
                placeholder="Team"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white"
          >
            {saving ? "Сохраняем..." : "Сохранить и пересчитать"}
          </button>
        </div>
      </section>
    </div>
  );
}
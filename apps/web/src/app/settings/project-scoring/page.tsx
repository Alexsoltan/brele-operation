"use client";

import { useEffect, useState } from "react";

type ScoringItem = {
  key: string;
  label: string;
  value: number;
};

export default function ProjectScoringPage() {
  const [items, setItems] = useState<ScoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/project-scoring")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? data);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateValue(key: string, value: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, value } : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);

    const res = await fetch("/api/project-scoring", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    const data = await res.json();

    alert(`Пересчитано проектов: ${data.recalculatedProjects}`);

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-6 text-white">Загрузка настроек…</div>
    );
  }
    return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Скоринг проекта
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Настрой веса, которые влияют на здоровье проекта. После сохранения все проекты пересчитываются.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.key}
              className="grid grid-cols-[1fr_120px] items-center gap-4 rounded-2xl border border-gray-100 bg-[#fbfbfa] p-4"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {item.label}
                </div>

                <div className="mt-1 text-xs text-gray-400">
                  {item.key}
                </div>
              </div>

              <input
                type="number"
                step="1"
                value={item.value}
                onChange={(event) =>
                  updateValue(item.key, Number(event.target.value))
                }
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-right text-sm font-semibold outline-none transition focus:border-black"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {saving ? "Сохраняем и пересчитываем..." : "Сохранить и пересчитать"}
          </button>
        </div>
      </section>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit3, Plus, Search, Trash2, X } from "lucide-react";

type Direction = "positive" | "negative" | "neutral";

type SignalTypeConfig = {
  id: string;
  key: string;
  label: string;
  isHighRisk: boolean;
  direction: Direction;
  healthImpact: number;
  clientMoodImpact: number;
  teamMoodImpact: number;
  description?: string | null;
  sortOrder: number;
};

type FormState = {
  id?: string;
  key: string;
  label: string;
  isHighRisk: boolean;
  direction: Direction;
  healthImpact: number;
  clientMoodImpact: number;
  teamMoodImpact: number;
  description: string;
  sortOrder: number;
};

const emptyForm: FormState = {
  key: "",
  label: "",
  isHighRisk: false,
  direction: "neutral",
  healthImpact: 0,
  clientMoodImpact: 0,
  teamMoodImpact: 0,
  description: "",
  sortOrder: 0,
};

function directionLabel(value: Direction) {
  if (value === "positive") return "Позитивный";
  if (value === "negative") return "Отрицательный";
  return "Нейтральный";
}

function directionTone(value: Direction) {
  if (value === "positive") return "bg-[#d9ff3f] text-black";
  if (value === "negative") return "bg-[#ffd7d7] text-[#7f1d1d]";
  return "bg-gray-100 text-gray-600";
}

function numberTone(value: number) {
  if (value > 0) return "text-[#1f5f34]";
  if (value < 0) return "text-[#7f1d1d]";
  return "text-gray-400";
}

export default function SignalSettingsPage() {
  const [items, setItems] = useState<SignalTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<"all" | Direction>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/signal-types");
      const data = await res.json();

      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const search = query.trim().toLowerCase();

      const matchesSearch =
        !search ||
        item.label.toLowerCase().includes(search) ||
        item.key.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search);

      const matchesDirection =
        direction === "all" || item.direction === direction;

      return matchesSearch && matchesDirection;
    });
  }, [direction, items, query]);

  function openCreateModal() {
    setForm({
      ...emptyForm,
      sortOrder: items.length * 10 + 10,
    });
    setModalOpen(true);
  }

  function openEditModal(item: SignalTypeConfig) {
    setForm({
      id: item.id,
      key: item.key,
      label: item.label,
      isHighRisk: item.isHighRisk,
      direction: item.direction,
      healthImpact: item.healthImpact,
      clientMoodImpact: item.clientMoodImpact,
      teamMoodImpact: item.teamMoodImpact,
      description: item.description ?? "",
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  }

  async function saveForm() {
    if (!form.key.trim() || !form.label.trim()) return;

    setSaving(true);

    try {
      const payload = {
        key: form.key.trim(),
        label: form.label.trim(),
        isHighRisk: form.isHighRisk,
        direction: form.direction,
        healthImpact: Number(form.healthImpact),
        clientMoodImpact: Number(form.clientMoodImpact),
        teamMoodImpact: Number(form.teamMoodImpact),
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder),
        isActive: true,
      };

      const res = await fetch(
        form.id ? `/api/signal-types/${form.id}` : "/api/signal-types",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to save signal type");
      }

      await load();
      setModalOpen(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const confirmed = window.confirm(
      "Удалить тип сигнала? Старые сигналы останутся в истории, но тип пропадёт из активного справочника.",
    );

    if (!confirmed) return;

    await fetch(`/api/signal-types/${id}`, {
      method: "DELETE",
    });

    await load();
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#1f1f1f] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
              Signal dictionary
            </div>

            <h1 className="font-heading text-3xl font-semibold tracking-[-0.05em]">
              Сигналы
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Управление типами сигналов, влиянием на здоровье проекта,
              настроение клиента и команды. Этот справочник позже будет
              использоваться AI при классификации встреч и чатов.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#d9ff3f]"
          >
            <Plus size={16} />
            Добавить сигнал
          </button>
        </div>
      </section>

      <section className="rounded-[34px] border border-gray-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию, переменной или описанию"
              className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] pl-10 pr-4 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div className="inline-flex rounded-full bg-[#f3f3f1] p-1 text-sm font-medium text-gray-500">
            {[
              ["all", "Все"],
              ["positive", "Позитив"],
              ["negative", "Негатив"],
              ["neutral", "Нейтрально"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDirection(value as "all" | Direction)}
                className={[
                  "rounded-full px-4 py-2 transition",
                  direction === value
                    ? "bg-black text-white"
                    : "hover:bg-white hover:text-black",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-[26px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
            Загружаем справочник сигналов...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-gray-200 bg-[#fbfbfa] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d9ff3f] text-black">
              <AlertTriangle size={22} />
            </div>

            <h3 className="text-lg font-semibold text-gray-950">
              Сигналов пока нет
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Создай первый тип сигнала. Позже AI будет выбирать только из
              этого управляемого справочника.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Plus size={16} />
              Добавить первый сигнал
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-gray-200">
            <div className="grid grid-cols-[1.35fr_0.9fr_0.8fr_0.75fr_0.75fr_0.75fr_90px] bg-[#f3f3f1] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <div>Тип сигнала</div>
              <div>Переменная</div>
              <div>Характер</div>
              <div className="text-right">Здоровье</div>
              <div className="text-right">Клиент</div>
              <div className="text-right">Команда</div>
              <div className="text-right">Действия</div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.35fr_0.9fr_0.8fr_0.75fr_0.75fr_0.75fr_90px] items-center px-4 py-4 transition hover:bg-[#fbfbfa]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-950">
                        {item.label}
                      </div>

                      {item.isHighRisk ? (
                        <span className="rounded-full bg-[#ffd7d7] px-2 py-0.5 text-[11px] font-bold text-[#7f1d1d]">
                          High risk
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 line-clamp-1 text-xs text-gray-400">
                      {item.description || "Описание не добавлено"}
                    </div>
                  </div>

                  <div className="font-mono text-xs text-gray-500">
                    {item.key}
                  </div>

                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        directionTone(item.direction),
                      ].join(" ")}
                    >
                      {directionLabel(item.direction)}
                    </span>
                  </div>

                  <div
                    className={[
                      "text-right text-sm font-bold",
                      numberTone(item.healthImpact),
                    ].join(" ")}
                  >
                    {item.healthImpact > 0 ? "+" : ""}
                    {item.healthImpact}
                  </div>

                  <div
                    className={[
                      "text-right text-sm font-bold",
                      numberTone(item.clientMoodImpact),
                    ].join(" ")}
                  >
                    {item.clientMoodImpact > 0 ? "+" : ""}
                    {item.clientMoodImpact}
                  </div>

                  <div
                    className={[
                      "text-right text-sm font-bold",
                      numberTone(item.teamMoodImpact),
                    ].join(" ")}
                  >
                    {item.teamMoodImpact > 0 ? "+" : ""}
                    {item.teamMoodImpact}
                  </div>

                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="rounded-full p-2 text-gray-400 transition hover:bg-[#ffd7d7] hover:text-[#7f1d1d]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/35 px-6 py-8 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-[34px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-[#d9ff3f] px-3 py-1 text-xs font-bold text-black">
                  {form.id ? "Редактирование" : "Новый тип"}
                </div>

                <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
                  {form.id ? "Редактировать сигнал" : "Добавить сигнал"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Задай название, переменную и влияние на ключевые показатели.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Тип сигнала
                </span>
                <input
                  value={form.label}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Клиент недоволен"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Переменная для кода
                </span>
                <input
                  value={form.key}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, key: event.target.value }))
                  }
                  placeholder="client_dissatisfaction"
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 font-mono text-sm outline-none focus:border-black"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Характер сигнала
                </span>
                <select
                  value={form.direction}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      direction: event.target.value as Direction,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
                >
                  <option value="positive">Позитивный</option>
                  <option value="negative">Отрицательный</option>
                  <option value="neutral">Нейтральный</option>
                </select>
              </label>

              <label className="flex h-[74px] items-end gap-3 rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 pb-3">
                <input
                  type="checkbox"
                  checked={form.isHighRisk}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isHighRisk: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Высокий риск для фильтров и UI
                </span>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Влияние на здоровье
                </span>
                <input
                  type="number"
                  value={form.healthImpact}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      healthImpact: Number(event.target.value),
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Настроение клиента
                </span>
                <input
                  type="number"
                  value={form.clientMoodImpact}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      clientMoodImpact: Number(event.target.value),
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-gray-500">
                  Настроение команды
                </span>
                <input
                  type="number"
                  value={form.teamMoodImpact}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      teamMoodImpact: Number(event.target.value),
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 text-sm outline-none focus:border-black"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-semibold text-gray-500">
                Описание для менеджера / будущего prompt
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Когда использовать этот тип сигнала..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-[#f3f3f1] p-4 text-sm leading-6 outline-none focus:border-black"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={saveForm}
                disabled={saving || !form.key.trim() || !form.label.trim()}
                className="rounded-2xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {saving ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

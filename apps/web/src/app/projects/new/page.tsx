"use client";

import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !clientName.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          client: clientName.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Project creation failed");
      }

      const project = await response.json();

      router.push(`/projects/${project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/projects"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к проектам
        </Link>

        <PageTitle>Создать проект</PageTitle>
        <p className="mt-1 text-sm text-gray-500">
          Добавь клиентский проект, чтобы затем прикреплять встречи и
          анализировать динамику
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Название проекта
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например: Альфа-Банк — Mobile App"
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Клиент</label>
          <input
            type="text"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Например: Альфа-Банк"
            className="w-full rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Описание</label>
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Кратко опиши проект, команду, контекст и особенности клиента"
            className="w-full resize-none rounded-2xl border border-gray-200 bg-[#f3f3f1] px-4 py-3 text-sm outline-none focus:border-black"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/projects"
            className="rounded-2xl px-4 py-2 text-sm font-medium text-gray-500 hover:text-black"
          >
            Отмена
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !clientName.trim()}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? "Создаём..." : "Создать проект"}
          </button>
        </div>
      </form>
    </div>
  );
}
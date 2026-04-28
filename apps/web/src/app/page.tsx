import Link from "next/link";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{description}</div>
    </div>
  );
}

function ProjectCard() {
  return (
    <Link
      href="/projects/alfa-mobile-app"
      className="group flex cursor-pointer flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold transition group-hover:text-black">
            Альфа-Банк — Mobile App
          </div>
          <div className="text-sm text-gray-500">Клиент: Альфа-Банк</div>
        </div>

        <div className="rounded-full bg-gray-100 px-2 py-1 text-xs">
          Активный
        </div>
      </div>

      <div className="flex gap-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Клиент</span>
          <MoodBadge mood="neutral" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Команда</span>
          <MoodBadge mood="good" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-400">Риск</span>
          <RiskBadge risk="low" />
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Последняя встреча: 24 Apr 2026
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-rubik text-2xl font-semibold">Дашборд</h1>
        <p className="mt-1 text-sm text-gray-500">
          Обзор всех активных проектов и состояния клиентов
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Активные проекты" value="12" description="Сейчас в работе" />
        <StatCard title="В зоне риска" value="2" description="Негативное настроение клиента" />
        <StatCard title="Негативная динамика" value="3" description="Последние встречи хуже" />
        <StatCard title="Нет встреч" value="4" description="Давно не было контакта" />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Активные проекты</h2>

        <div className="grid grid-cols-3 gap-4">
          <ProjectCard />
          <ProjectCard />
          <ProjectCard />
        </div>
      </div>
    </div>
  );
}
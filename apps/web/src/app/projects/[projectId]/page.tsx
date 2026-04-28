import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, TrendingDown } from "lucide-react";
import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { MoodSpeedometer } from "@/components/mood-speedometer";
import { MoodTrendChart } from "@/components/mood-trend-chart";

const meetings = [
  {
    id: "meeting-1",
    title: "Демо дизайна клиенту",
    date: "24 Apr 2026",
    clientMood: "good" as const,
    teamMood: "good" as const,
    risk: "low" as const,
    summary:
      "Клиент положительно отреагировал на обновлённый дизайн и согласовал следующий этап.",
  },
  {
    id: "meeting-2",
    title: "Синк с клиентом",
    date: "18 Apr 2026",
    clientMood: "neutral" as const,
    teamMood: "good" as const,
    risk: "low" as const,
    summary:
      "Обсудили открытые вопросы по мобильной версии и договорились зафиксировать сроки письменно.",
  },
  {
    id: "meeting-3",
    title: "Планирование этапа",
    date: "11 Apr 2026",
    clientMood: "bad" as const,
    teamMood: "neutral" as const,
    risk: "medium" as const,
    summary:
      "Клиент был недоволен прозрачностью сроков. Команда объяснила причины задержек, но нужен новый план.",
  },
];

export default function ProjectPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black"
        >
          <ArrowLeft size={16} />
          Назад к дашборду
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-rubik text-2xl font-semibold">Альфа-Банк — Mobile App</h1>
            <p className="mt-1 text-sm text-gray-500">
              Аналитика встреч, настроение клиента и состояние команды
            </p>
          </div>

          <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">Активный</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MoodSpeedometer title="Настроение клиента" value="good" />
        <MoodSpeedometer title="Настроение команды" value="good" />
        <MoodSpeedometer title="Риск проекта" value="low" />
      </div>

      <MoodTrendChart />

      <div className="grid grid-cols-[1.4fr_0.9fr] gap-4">
        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Встречи проекта</h2>
              <p className="mt-1 text-sm text-gray-500">
                Последние клиентские встречи и AI-оценка состояния
              </p>
            </div>

            <button className="rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white">
              Добавить встречу
            </button>
          </div>

          <div className="space-y-3">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="rounded-3xl border border-gray-200 bg-[#f3f3f1] p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{meeting.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={14} />
                      {meeting.date}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <MoodBadge mood={meeting.clientMood} />
                    <RiskBadge risk={meeting.risk} />
                  </div>
                </div>

                <p className="text-sm leading-6 text-gray-600">{meeting.summary}</p>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="mb-1 text-xs text-gray-400">Клиент</div>
                    <MoodBadge mood={meeting.clientMood} />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-gray-400">Команда</div>
                    <MoodBadge mood={meeting.teamMood} />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-gray-400">Риск</div>
                    <RiskBadge risk={meeting.risk} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Сигналы</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-red-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <TrendingDown size={16} />
                  Просадка 11 Apr
                </div>
                <p className="mt-2 text-sm leading-6 text-red-700">
                  Была просадка по прозрачности сроков. После фиксации плана настроение клиента
                  восстановилось.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText size={16} />
                  Следующее действие
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Отправить клиенту короткий summary по согласованному следующему этапу.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
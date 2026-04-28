const meetingTypes = [
  {
    name: "Синк",
    description: "Регулярная встреча по статусу проекта, блокерам и следующим шагам.",
  },
  {
    name: "Демо",
    description: "Показ результата клиенту и сбор обратной связи.",
  },
  {
    name: "Планирование",
    description: "Обсуждение задач, сроков, приоритетов и состава работ.",
  },
  {
    name: "Приёмка",
    description: "Финальное согласование результата или этапа проекта.",
  },
  {
    name: "Разбор рисков",
    description: "Встреча по проблемам, просадкам, конфликтам и критичным сигналам.",
  },
];

export default function MeetingTypesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Типы встреч</h1>
        <p className="mt-1 text-sm text-gray-500">
          Справочник типов встреч для AI-анализа и аналитики проектов
        </p>
      </div>

      <section className="grid grid-cols-3 gap-4">
        {meetingTypes.map((type) => (
          <article
            key={type.name}
            className="rounded-3xl border border-gray-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold">{type.name}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {type.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
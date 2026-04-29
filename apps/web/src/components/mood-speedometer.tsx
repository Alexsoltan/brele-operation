type IndicatorValue = "bad" | "neutral" | "good" | "low" | "medium" | "high";

const config: Record<
  IndicatorValue,
  {
    label: string;
    position: string;
    tone: string;
    dot: string;
    labels: [string, string, string];
  }
> = {
  bad: {
    label: "Плохо",
    position: "left-[8%]",
    tone: "bg-red-500 text-white",
    dot: "bg-red-500",
    labels: ["Плохо", "Нейтр.", "Хорошо"],
  },
  neutral: {
    label: "Нейтрально",
    position: "left-1/2",
    tone: "bg-gray-500 text-white",
    dot: "bg-gray-500",
    labels: ["Плохо", "Нейтр.", "Хорошо"],
  },
  good: {
    label: "Хорошо",
    position: "left-[92%]",
    tone: "bg-green-500 text-white",
    dot: "bg-green-500",
    labels: ["Плохо", "Нейтр.", "Хорошо"],
  },
  low: {
    label: "Низкий",
    position: "left-[8%]",
    tone: "bg-green-500 text-white",
    dot: "bg-green-500",
    labels: ["Низкий", "Средний", "Высокий"],
  },
  medium: {
    label: "Средний",
    position: "left-1/2",
    tone: "bg-gray-500 text-white",
    dot: "bg-gray-500",
    labels: ["Низкий", "Средний", "Высокий"],
  },
  high: {
    label: "Высокий",
    position: "left-[92%]",
    tone: "bg-red-500 text-white",
    dot: "bg-red-500",
    labels: ["Низкий", "Средний", "Высокий"],
  },
};

export function MoodSpeedometer({
  title,
  value,
}: {
  title: string;
  value: IndicatorValue;
}) {
  const item = config[value];

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-heading text-lg font-semibold tracking-[-0.02em]">
            {title}
          </div>

          <div
            className={[
              "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
              item.tone,
            ].join(" ")}
          >
            {item.label}
          </div>
        </div>
      </div>

      <div className="mt-7">
        <div className="relative h-2 rounded-full bg-gray-200">
          <div
            className={[
              "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md",
              item.position,
              item.dot,
            ].join(" ")}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 text-[11px] text-gray-400">
          <span>{item.labels[0]}</span>
          <span className="text-center">{item.labels[1]}</span>
          <span className="text-right">{item.labels[2]}</span>
        </div>
      </div>
    </section>
  );
}
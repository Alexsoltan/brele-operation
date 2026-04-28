type SpeedometerValue = "bad" | "neutral" | "good" | "low" | "medium" | "high";

const valueConfig: Record<SpeedometerValue, { label: string; angle: number; labelClassName: string; redSide: "left" | "right" }> = {
  bad: { label: "Плохо", angle: -58, labelClassName: "text-red-700", redSide: "left" },
  neutral: { label: "Нейтрально", angle: 0, labelClassName: "text-black", redSide: "left" },
  good: { label: "Хорошо", angle: 58, labelClassName: "text-green-700", redSide: "left" },
  low: { label: "Низкий", angle: -58, labelClassName: "text-green-700", redSide: "right" },
  medium: { label: "Средний", angle: 0, labelClassName: "text-black", redSide: "right" },
  high: { label: "Высокий", angle: 58, labelClassName: "text-red-700", redSide: "right" },
};

export function MoodSpeedometer({ title, value }: { title: string; value: SpeedometerValue }) {
  const config = valueConfig[value];

  const leftColor = config.redSide === "left" ? "#fecaca" : "#bbf7d0";
  const rightColor = config.redSide === "left" ? "#bbf7d0" : "#fecaca";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="text-sm font-medium text-gray-500">{title}</div>

      <div className="mt-3 flex justify-center">
        <div className="relative h-40 w-64">
          <svg viewBox="0 0 240 155" className="h-full w-full">
            <path d="M 38 105 A 86 86 0 0 1 88 25" fill="none" stroke={leftColor} strokeWidth="20" strokeLinecap="round" />
            <path d="M 88 25 A 86 86 0 0 1 152 25" fill="none" stroke="#e5e7eb" strokeWidth="20" strokeLinecap="round" />
            <path d="M 152 25 A 86 86 0 0 1 202 105" fill="none" stroke={rightColor} strokeWidth="20" strokeLinecap="round" />

            <line
              x1="120"
              y1="105"
              x2="120"
              y2="52"
              stroke="#111827"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                transformOrigin: "120px 105px",
                transform: `rotate(${config.angle}deg)`,
              }}
            />

            <circle cx="120" cy="105" r="8" fill="#111827" />
          </svg>

          <div className="absolute bottom-1 left-0 right-0 text-center">
            <div className={`font-rubik text-2xl font-semibold leading-none ${config.labelClassName}`}>
              {config.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

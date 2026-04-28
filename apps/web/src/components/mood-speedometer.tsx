type SpeedometerValue = "bad" | "neutral" | "good" | "low" | "medium" | "high";

const valueConfig: Record<
  SpeedometerValue,
  {
    label: string;
    angle: number;
    labelClassName: string;
    isRisk: boolean;
  }
> = {
  bad: { label: "Плохо", angle: -48, labelClassName: "text-red-700", isRisk: false },
  neutral: { label: "Нейтрально", angle: 0, labelClassName: "text-gray-950", isRisk: false },
  good: { label: "Хорошо", angle: 48, labelClassName: "text-green-700", isRisk: false },
  low: { label: "Низкий", angle: -48, labelClassName: "text-green-700", isRisk: true },
  medium: { label: "Средний", angle: 0, labelClassName: "text-gray-950", isRisk: true },
  high: { label: "Высокий", angle: 48, labelClassName: "text-red-700", isRisk: true },
};

export function MoodSpeedometer({
  title,
  value,
}: {
  title: string;
  value: SpeedometerValue;
}) {
  const config = valueConfig[value];

  const gradient = config.isRisk
    ? "conic-gradient(from 270deg, #bbf7d0 0deg, #bbf7d0 50deg, #e5e7eb 70deg, #e5e7eb 110deg, #fecaca 130deg, #fecaca 180deg, transparent 180deg, transparent 360deg)"
    : "conic-gradient(from 270deg, #fecaca 0deg, #fecaca 50deg, #e5e7eb 70deg, #e5e7eb 110deg, #bbf7d0 130deg, #bbf7d0 180deg, transparent 180deg, transparent 360deg)";

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="font-heading text-lg font-semibold tracking-[-0.02em] text-gray-950">
  {title}
</div>

      <div className="mt-5 flex flex-col items-center">
        <div className="relative h-[132px] w-[210px] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-[210px] w-[210px] rounded-full"
            style={{
              background: gradient,
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 23px))",
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 24px), #000 calc(100% - 23px))",
            }}
          />

          <svg viewBox="0 0 210 132" className="absolute left-0 top-0 h-[132px] w-[210px]">
            <g
              style={{
                transform: `rotate(${config.angle}deg)`,
                transformOrigin: "105px 105px",
                transition: "transform 260ms ease",
              }}
            >
              <line
                x1="105"
                y1="105"
                x2="105"
                y2="46"
                stroke="#111827"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </g>

            <circle cx="105" cy="105" r="11" fill="#111827" />
          </svg>
        </div>

        <div
          className={[
            "-mt-2 font-heading text-2xl font-semibold leading-none tracking-[-0.03em]",
            config.labelClassName,
          ].join(" ")}
        >
          {config.label}
        </div>
      </div>
    </section>
  );
}
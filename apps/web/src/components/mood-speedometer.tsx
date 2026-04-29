import { Minus, TrendingDown, TrendingUp } from "lucide-react";

type SpeedometerValue = "bad" | "neutral" | "good" | "low" | "medium" | "high";
type Trend = "up" | "down" | "flat";
type TrendKind = "mood" | "risk";

const valueConfig: Record<
  SpeedometerValue,
  {
    label: string;
    caption: string;
    tone: "green" | "red" | "neutral";
  }
> = {
  bad: { label: "Плохо", caption: "негативный сигнал", tone: "red" },
  neutral: { label: "Нейтр.", caption: "без явного сигнала", tone: "neutral" },
  good: { label: "Хорошо", caption: "позитивный сигнал", tone: "green" },
  low: { label: "Низкий", caption: "риск под контролем", tone: "green" },
  medium: { label: "Средний", caption: "требует внимания", tone: "neutral" },
  high: { label: "Высокий", caption: "критичный сигнал", tone: "red" },
};

function TrendMark({ trend, kind }: { trend: Trend; kind: TrendKind }) {
  const isPositive = kind === "mood" ? trend === "up" : trend === "down";
  const isNegative = kind === "mood" ? trend === "down" : trend === "up";

  const className = isPositive
    ? "text-green-300 drop-shadow-[0_0_16px_rgba(134,239,172,0.45)]"
    : isNegative
      ? "text-red-300 drop-shadow-[0_0_16px_rgba(252,165,165,0.45)]"
      : "text-white/45";

  if (trend === "up") {
    return <TrendingUp size={25} strokeWidth={2.4} className={className} />;
  }

  if (trend === "down") {
    return <TrendingDown size={25} strokeWidth={2.4} className={className} />;
  }

  return <Minus size={25} strokeWidth={2.4} className={className} />;
}

export function MoodSpeedometer({
  title,
  value,
  trend = "flat",
  trendKind = "mood",
}: {
  title: string;
  value: SpeedometerValue;
  trend?: Trend;
  trendKind?: TrendKind;
}) {
  const config = valueConfig[value];

  const glow =
    config.tone === "green"
      ? "from-green-300/75 via-green-300/25 to-transparent"
      : config.tone === "red"
        ? "from-red-300/75 via-red-300/25 to-transparent"
        : "from-white/25 via-white/10 to-transparent";

  const dot =
    config.tone === "green"
      ? "bg-green-300 shadow-[0_0_28px_rgba(134,239,172,0.8)]"
      : config.tone === "red"
        ? "bg-red-300 shadow-[0_0_28px_rgba(252,165,165,0.8)]"
        : "bg-gray-300 shadow-[0_0_22px_rgba(209,213,219,0.45)]";

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#20201f] p-6 text-white shadow-sm">
      <div
        className={[
          "pointer-events-none absolute -left-20 bottom-[-88px] h-64 w-64 rounded-full bg-gradient-to-tr blur-2xl",
          glow,
        ].join(" ")}
      />

      <div
        className={[
          "pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br blur-2xl",
          glow,
        ].join(" ")}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="font-heading text-xl font-semibold tracking-[-0.03em] text-white/90">
          {title}
        </div>

        <span className={["h-3.5 w-3.5 rounded-full", dot].join(" ")} />
      </div>

      <div className="relative mt-12">
        <div className="flex items-center gap-3">
          <div className="font-heading text-[34px] font-semibold leading-none tracking-[-0.055em]">
            {config.label}
          </div>

          <TrendMark trend={trend} kind={trendKind} />
        </div>

        <div className="mt-3 text-sm text-white/45">{config.caption}</div>
      </div>
    </section>
  );
}
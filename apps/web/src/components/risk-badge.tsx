type Risk = "low" | "medium" | "high";

const riskConfig: Record<Risk, { label: string; className: string }> = {
  low: {
    label: "Низкий",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  medium: {
    label: "Средний",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  high: {
    label: "Высокий",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function RiskBadge({ risk, label }: { risk: Risk; label?: string }) {
  const config = riskConfig[risk];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
      ].join(" ")}
    >
      {label ? `${label}: ${config.label}` : config.label}
    </span>
  );
}
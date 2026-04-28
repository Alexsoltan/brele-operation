type Risk = "low" | "medium" | "high";

const riskConfig: Record<Risk, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-700",
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-100 text-yellow-700",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-700",
  },
};

export function RiskBadge({ risk }: { risk: Risk }) {
  const config = riskConfig[risk];

  return (
    <span className={`rounded-full px-2 py-1 text-xs ${config.className}`}>
      {config.label}
    </span>
  );
}

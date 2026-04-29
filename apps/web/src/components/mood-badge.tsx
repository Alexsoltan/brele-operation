type Mood = "good" | "neutral" | "bad";

const moodConfig: Record<Mood, { label: string; className: string }> = {
  good: {
    label: "Хорошо",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  neutral: {
    label: "Нейтрально",
    className: "border-gray-200 bg-gray-100 text-gray-600",
  },
  bad: {
    label: "Плохо",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function MoodBadge({ mood, label }: { mood: Mood; label?: string }) {
  const config = moodConfig[mood];

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
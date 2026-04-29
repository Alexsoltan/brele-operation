type Mood = "good" | "neutral" | "bad";

const moodConfig: Record<Mood, { label: string; className: string }> = {
  good: {
    label: "Good",
    className: "bg-green-100 text-green-700",
  },
  neutral: {
    label: "Neutral",
    className: "bg-gray-100 text-gray-700",
  },
  bad: {
    label: "Bad",
    className: "bg-red-100 text-red-700",
  },
};

export function MoodBadge({ mood }: { mood: Mood }) {
  const config = moodConfig[mood];

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
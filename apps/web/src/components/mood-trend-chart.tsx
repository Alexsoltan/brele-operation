type Mood = "good" | "neutral" | "bad";

const moodToY: Record<Mood, number> = {
  good: 34,
  neutral: 74,
  bad: 114,
};

const updates: Record<number, { client: Mood; team: Mood }> = {
  4: { client: "neutral", team: "good" },
  11: { client: "bad", team: "neutral" },
  18: { client: "neutral", team: "good" },
  24: { client: "good", team: "good" },
};

const days = Array.from({ length: 31 }, (_, index) => index + 1);

function buildSeries(key: "client" | "team") {
  let current: Mood = "neutral";

  return days.map((day, index) => {
    const update = updates[day];

    if (update) {
      current = update[key];
    }

    return {
      day,
      x: 42 + index * 18,
      y: moodToY[current],
      hasMeeting: Boolean(update),
    };
  });
}

function buildLine(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

const clientSeries = buildSeries("client");
const teamSeries = buildSeries("team");

export function MoodTrendChart() {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold">Динамика настроения</h2>
          <p className="mt-1 text-sm text-gray-500">Клиент и команда за выбранный период</p>
        </div>

        <div className="flex shrink-0 rounded-2xl bg-[#f3f3f1] p-1">
          {["Неделя", "Месяц", "Квартал", "Полгода", "Год", "Кастом"].map((period) => (
            <button
              key={period}
              type="button"
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                period === "Месяц" ? "bg-black text-white" : "text-gray-500 hover:bg-white hover:text-black"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-black" />
          Клиент
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          Команда
        </div>
      </div>

      <svg viewBox="0 0 640 150" className="h-44 w-full">
        <line x1="34" y1="34" x2="620" y2="34" stroke="#eeeeec" strokeWidth="1" />
        <line x1="34" y1="74" x2="620" y2="74" stroke="#eeeeec" strokeWidth="1" />
        <line x1="34" y1="114" x2="620" y2="114" stroke="#eeeeec" strokeWidth="1" />

        <text x="0" y="38" fontSize="11" fill="#9ca3af">
          Хорошо
        </text>
        <text x="0" y="78" fontSize="11" fill="#9ca3af">
          Нейтр.
        </text>
        <text x="0" y="118" fontSize="11" fill="#9ca3af">
          Плохо
        </text>

        <polyline
          points={buildLine(teamSeries)}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <polyline
          points={buildLine(clientSeries)}
          fill="none"
          stroke="#111827"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {days.map((day, index) => {
          const x = 42 + index * 18;
          const update = updates[day];

          return (
            <g key={day}>
              {update ? (
                <>
                  <circle cx={x} cy={moodToY[update.team]} r="3.5" fill="#9ca3af" />
                  <circle cx={x} cy={moodToY[update.client]} r="3.5" fill="#111827" />
                </>
              ) : null}

              <text
                x={x}
                y="142"
                textAnchor="middle"
                fontSize="9"
                fill={update ? "#111827" : "#9ca3af"}
                fontWeight={update ? 600 : 400}
              >
                {day}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
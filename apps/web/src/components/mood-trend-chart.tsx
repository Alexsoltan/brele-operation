"use client";

import { useState } from "react";

type Mood = "good" | "neutral" | "bad";

const moodToY: Record<Mood, number> = {
  good: 34,
  neutral: 74,
  bad: 114,
};

const moodToValue: Record<Mood, number> = {
  good: 1,
  neutral: 0,
  bad: -1,
};

const updates: Record<number, { client: Mood; team: Mood }> = {
  4: { client: "neutral", team: "good" },
  11: { client: "bad", team: "neutral" },
  18: { client: "neutral", team: "good" },
  24: { client: "good", team: "good" },
};

const days = Array.from({ length: 31 }, (_, i) => i + 1);

function buildSeries(key: "client" | "team") {
  let current: Mood = "neutral";

  return days.map((day, index) => {
    const update = updates[day];

    if (update) current = update[key];

    return {
      day,
      x: 42 + index * 18,
      y: moodToY[current],
      mood: current,
      value: moodToValue[current],
      hasMeeting: Boolean(update),
    };
  });
}

function smoothPath(points: any[]) {
  return points.reduce((path, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;

    const prev = points[i - 1];
    const dx = (p.x - prev.x) / 2;

    return `${path} C ${prev.x + dx} ${prev.y}, ${p.x - dx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
}

const clientSeries = buildSeries("client");
const teamSeries = buildSeries("team");

export function MoodTrendChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const hovered = hoverIndex !== null ? clientSeries[hoverIndex] : null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Динамика настроения</h2>
          <p className="mt-1 text-sm text-gray-500">
            Клиент и команда за выбранный период
          </p>
        </div>

        <div className="flex rounded-2xl bg-[#f3f3f1] p-1">
          {["Неделя", "Месяц", "Квартал", "Полгода", "Год"].map((p) => (
            <button
              key={p}
              className={`rounded-xl px-3 py-1.5 text-xs ${
                p === "Месяц"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox="0 0 640 150" className="w-full h-44">
          {/* GRID */}
          {[34, 74, 114].map((y) => (
            <line
              key={y}
              x1="34"
              x2="620"
              y1={y}
              y2={y}
              stroke="#eeeeec"
              strokeWidth="1"
            />
          ))}

          {/* GRADIENT */}
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* TEAM */}
          <path
            d={smoothPath(teamSeries)}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* CLIENT (gradient) */}
          <path
            d={smoothPath(clientSeries)}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            className="opacity-90 transition-all duration-700"
          />

          {/* VERTICAL HOVER LINE */}
          {hoverIndex !== null && (
            <line
              x1={clientSeries[hoverIndex].x}
              x2={clientSeries[hoverIndex].x}
              y1="20"
              y2="130"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )}

          {/* POINTS */}
          {clientSeries.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {p.hasMeeting && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 5 : 3.5}
                  fill="#111827"
                  className="transition-all"
                />
              )}
            </g>
          ))}

          {/* DAYS */}
          {clientSeries.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y="142"
              textAnchor="middle"
              fontSize="9"
              fill={p.hasMeeting ? "#111827" : "#9ca3af"}
            >
              {p.day}
            </text>
          ))}
        </svg>

        {/* TOOLTIP */}
        {hovered && hovered.hasMeeting && (
          <div
            className="absolute -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{
              left: hovered.x,
              top: hovered.y - 40,
            }}
          >
            <div className="font-medium">День {hovered.day}</div>
            <div className="text-gray-500">Настроение: {hovered.mood}</div>
          </div>
        )}
      </div>
    </section>
  );
}
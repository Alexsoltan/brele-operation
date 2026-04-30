import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { formatMeetingDate, type Meeting } from "@/lib/types";

type SignalTone = "danger" | "warning" | "positive" | "neutral";
type SignalKind = "risk" | "client" | "team" | "idea" | "status";

type ProjectSignal = {
  id: string;
  meetingId: string;
  meetingTitle: string;
  date: string;
  text: string;
  tone: SignalTone;
  kind: SignalKind;
  score: number;
};

function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[-–—•\s]+/, "")
    .trim();
}

function shorten(value: string, maxLength = 115) {
  const text = cleanText(value);

  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength).trim()}…`;
}

function firstSentence(value: string) {
  const text = cleanText(value);
  const match = text.match(/^(.+?[.!?])\s/);

  return shorten(match?.[1] ?? text);
}

function getMeetingTone(meeting: Meeting): SignalTone {
  if (meeting.risk === "high" || meeting.clientMood === "bad") {
    return "danger";
  }

  if (meeting.risk === "medium" || meeting.teamMood === "bad") {
    return "warning";
  }

  if (
    meeting.risk === "low" &&
    (meeting.clientMood === "good" || meeting.teamMood === "good")
  ) {
    return "positive";
  }

  return "neutral";
}

function getMeetingKind(meeting: Meeting, text: string): SignalKind {
  const lower = text.toLowerCase();

  if (
    meeting.risk === "high" ||
    meeting.risk === "medium" ||
    lower.includes("риск") ||
    lower.includes("блокер") ||
    lower.includes("срок") ||
    lower.includes("проблем")
  ) {
    return "risk";
  }

  if (
    meeting.hasClient !== false &&
    (lower.includes("клиент") ||
      lower.includes("заказчик") ||
      meeting.clientMood === "bad" ||
      meeting.clientMood === "good")
  ) {
    return "client";
  }

  if (
    lower.includes("команд") ||
    lower.includes("разработ") ||
    meeting.teamMood === "bad" ||
    meeting.teamMood === "good"
  ) {
    return "team";
  }

  if (
    lower.includes("иде") ||
    lower.includes("предлож") ||
    lower.includes("улучш")
  ) {
    return "idea";
  }

  return "status";
}

function getSignalScore(meeting: Meeting, tone: SignalTone) {
  let score = 0;

  if (tone === "danger") score += 100;
  if (tone === "warning") score += 70;
  if (tone === "positive") score += 45;
  if (tone === "neutral") score += 25;

  if (meeting.risk === "high") score += 40;
  if (meeting.risk === "medium") score += 20;
  if (meeting.clientMood === "bad") score += 35;
  if (meeting.teamMood === "bad") score += 25;
  if (meeting.clientMood === "good") score += 10;
  if (meeting.teamMood === "good") score += 8;

  return score;
}

function buildSignalFromMeeting(meeting: Meeting): ProjectSignal | null {
  if (meeting.analysisStatus === "pending") return null;

  const primaryText =
    meeting.highlights.find((highlight) => cleanText(highlight).length > 0) ??
    firstSentence(meeting.summary);

  const text = shorten(primaryText);

  if (!text) return null;

  const tone = getMeetingTone(meeting);
  const kind = getMeetingKind(meeting, text);

  return {
    id: `${meeting.id}-${kind}`,
    meetingId: meeting.id,
    meetingTitle: meeting.title,
    date: meeting.date,
    text,
    tone,
    kind,
    score: getSignalScore(meeting, tone),
  };
}

function buildSignals(meetings: Meeting[]) {
  return meetings
    .map(buildSignalFromMeeting)
    .filter((signal): signal is ProjectSignal => Boolean(signal))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.date.localeCompare(a.date);
    })
    .slice(0, 5);
}

function SignalIcon({ kind }: { kind: SignalKind }) {
  if (kind === "risk") return <ShieldAlert size={15} />;
  if (kind === "client") return <MessageCircle size={15} />;
  if (kind === "team") return <Sparkles size={15} />;
  if (kind === "idea") return <Lightbulb size={15} />;
  return <CheckCircle2 size={15} />;
}

function toneClassName(tone: SignalTone) {
  if (tone === "danger") {
    return "border-red-100 bg-red-50 text-red-800";
  }

  if (tone === "warning") {
    return "border-amber-100 bg-amber-50 text-amber-800";
  }

  if (tone === "positive") {
    return "border-green-100 bg-green-50 text-green-800";
  }

  return "border-gray-100 bg-[#f3f3f1] text-gray-700";
}

function iconClassName(tone: SignalTone) {
  if (tone === "danger") return "bg-red-100 text-red-700";
  if (tone === "warning") return "bg-amber-100 text-amber-700";
  if (tone === "positive") return "bg-green-100 text-green-700";
  return "bg-white text-gray-500";
}

export function ProjectSignals({ meetings }: { meetings: Meeting[] }) {
  const signals = buildSignals(meetings);

  return (
    <aside className="rounded-3xl border border-gray-200 bg-white p-6">
      <h2 className="font-heading text-xl font-semibold tracking-[-0.03em]">
        Сигналы
      </h2>

      <p className="mt-1 text-sm leading-6 text-gray-500">
        Самые важные короткие выводы из последних встреч проекта
      </p>

      <div className="mt-5">
        {signals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-[#f3f3f1] p-5 text-sm leading-6 text-gray-500">
            Пока нет достаточно важных сигналов. Они появятся после AI-анализа
            встреч.
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <Link
                key={signal.id}
                href={`/meetings/${signal.meetingId}`}
                className={[
                  "block rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
                  toneClassName(signal.tone),
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      iconClassName(signal.tone),
                    ].join(" ")}
                  >
                    <SignalIcon kind={signal.kind} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatMeetingDate(signal.date)}
                      </span>

                      <span>·</span>

                      <span className="truncate">{signal.meetingTitle}</span>
                    </div>

                    <div className="mt-2 text-sm font-medium leading-6">
                      {signal.text}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {signals.length > 0 ? (
        <div className="mt-5 rounded-3xl bg-[#f3f3f1] p-4 text-xs leading-5 text-gray-500">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Сейчас это сигналы из AI-highlights встреч. Позже сюда можно
            добавить отдельное AI-summary по проекту.
          </div>
        </div>
      ) : null}
    </aside>
  );
}
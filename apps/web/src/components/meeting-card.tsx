import Link from "next/link";
import { CalendarDays, Loader2 } from "lucide-react";

import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { formatMeetingDate, type Meeting } from "@/lib/meeting-store";

type MeetingCardProps = {
  meeting: Meeting;
  projectName?: string;
};

export function MeetingCard({ meeting, projectName }: MeetingCardProps) {
  const isPending = meeting.analysisStatus === "pending";
  const isError = meeting.analysisStatus === "error";

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-3xl border border-gray-200 bg-[#f3f3f1] p-5 transition hover:border-gray-300 hover:bg-white hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          {projectName ? (
            <div className="text-sm text-gray-500">{projectName}</div>
          ) : null}

          <h3 className="mt-1 font-heading font-semibold">
            {meeting.title}
          </h3>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <CalendarDays size={14} />
            {formatMeetingDate(meeting.date)}
          </div>
        </div>

        {isPending ? (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            AI-анализ
          </div>
        ) : isError ? (
          <div className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Ошибка анализа
          </div>
        ) : (
          <div className="flex shrink-0 gap-2">
            <MoodBadge mood={meeting.clientMood} />
            <MoodBadge mood={meeting.teamMood} />
            <RiskBadge risk={meeting.risk} />
          </div>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
        {meeting.summary}
      </p>

      {isError ? (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          AI-анализ не завершился. Встреча сохранена, можно будет повторить
          обработку позже.
        </div>
      ) : null}

      {!isPending && meeting.highlights.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {meeting.highlights.slice(0, 3).map((highlight, index) => (
            <span
              key={`${meeting.id}-${index}`}
              className="rounded-full bg-white px-3 py-1 text-xs text-gray-500"
            >
              {highlight}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
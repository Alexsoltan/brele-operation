import Link from "next/link";
import { CalendarDays, FolderKanban, Loader2 } from "lucide-react";

import { MoodBadge } from "@/components/mood-badge";
import { RiskBadge } from "@/components/risk-badge";
import { formatMeetingDate, type Meeting } from "@/lib/types";

type MeetingCardProps = {
  meeting: Meeting & {
    project?: { id: string; name: string };
    type?: { id: string; name: string } | null;
  };
  projectName?: string;
  hideProjectName?: boolean;
};

export function MeetingCard({
  meeting,
  projectName,
  hideProjectName = false,
}: MeetingCardProps) {
  const isPending = meeting.analysisStatus === "pending";
  const isError = meeting.analysisStatus === "error";

  const resolvedProjectName =
    projectName ?? meeting.project?.name ?? "Проект не указан";

  const resolvedMeetingType = meeting.type?.name ?? meeting.title;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block rounded-3xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!hideProjectName ? (
              <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
                {resolvedProjectName}
              </h3>
            ) : null}

            <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white">
              <FolderKanban size={13} />
              {resolvedMeetingType}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <CalendarDays size={14} />
            {formatMeetingDate(meeting.date)}
          </div>
        </div>

        {isPending ? (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f3f3f1] px-3 py-1 text-xs font-medium text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            AI-анализ
          </div>
        ) : isError ? (
          <div className="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Ошибка анализа
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <MoodBadge mood={meeting.clientMood} label="Клиент" />
            <RiskBadge risk={meeting.risk} label="Риск" />
            <MoodBadge mood={meeting.teamMood} label="Команда" />
          </div>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
        {meeting.summary}
      </p>

      {!isPending && meeting.highlights.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {meeting.highlights.slice(0, 3).map((highlight, index) => (
            <span
              key={`${meeting.id}-${index}`}
              className="rounded-full bg-[#f3f3f1] px-3 py-1 text-xs text-gray-500"
            >
              {highlight}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
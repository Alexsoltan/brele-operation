"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type UiDatePickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function formatDateForButton(value: string) {
  const date = parseLocalDate(value);

  if (Number.isNaN(date.getTime())) return "Выбрать дату";

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

function buildCalendarDays(activeMonth: Date) {
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayBasedStart = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let i = mondayBasedStart; i > 0; i -= 1) {
    days.push(new Date(year, month, 1 - i));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - mondayBasedStart - lastDay.getDate() + 1;
    days.push(new Date(year, month + 1, nextDay));
  }

  return days;
}

export function getLocalDateInputValue(date = new Date()) {
  return formatLocalDate(date);
}

export function UiDatePicker({
  label,
  value,
  onChange,
  disabled = false,
}: UiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMonth, setActiveMonth] = useState(() => parseLocalDate(value));
  const rootRef = useRef<HTMLDivElement | null>(null);

  const calendarDays = useMemo(
    () => buildCalendarDays(activeMonth),
    [activeMonth],
  );

  useEffect(() => {
    setActiveMonth(parseLocalDate(value));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative space-y-2">
      {label ? (
        <span className="block text-xs font-medium text-gray-500">{label}</span>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((current) => !current)}
        className={[
          "flex h-[50px] w-full items-center justify-between rounded-2xl border bg-[#f3f3f1] px-4 text-left text-sm outline-none transition",
          disabled
            ? "cursor-not-allowed border-gray-100 text-gray-400"
            : isOpen
              ? "border-black text-gray-950"
              : "border-gray-200 text-gray-950 hover:border-gray-300",
        ].join(" ")}
      >
        <span>{formatDateForButton(value)}</span>
        <CalendarDays size={16} className="shrink-0 text-gray-400" />
      </button>

      {isOpen ? (
        <div
          className={[
            "absolute right-0 z-50 w-[320px] rounded-3xl border border-gray-200 bg-white p-4 shadow-xl",
            label ? "top-[76px]" : "top-[56px]",
          ].join(" ")}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setActiveMonth(
                  new Date(
                    activeMonth.getFullYear(),
                    activeMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="font-heading text-sm font-semibold capitalize">
              {monthLabel(activeMonth)}
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveMonth(
                  new Date(
                    activeMonth.getFullYear(),
                    activeMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-black"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayValue = formatLocalDate(day);
              const isSelected = dayValue === value;
              const isCurrentMonth = day.getMonth() === activeMonth.getMonth();

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => {
                    onChange(dayValue);
                    setIsOpen(false);
                  }}
                  className={[
                    "h-9 rounded-full text-sm transition",
                    isSelected
                      ? "bg-black text-white"
                      : isCurrentMonth
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
};

type UiSelectProps = {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function UiSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: UiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

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
        <span className="truncate">{selectedOption?.label ?? "Выбрать"}</span>

        <ChevronDown
          size={17}
          className={[
            "ml-3 shrink-0 text-gray-400 transition",
            isOpen ? "rotate-180 text-gray-700" : "",
          ].join(" ")}
        />
      </button>

      {isOpen ? (
<div

  className={[

    "absolute left-0 right-0 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1 shadow-xl",

    label ? "top-[76px]" : "top-[56px]",

  ].join(" ")}

>
{options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition",
                  isSelected
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black",
                ].join(" ")}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check size={15} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
"use client";

import Link from "next/link";

type TabItem = {
  key: string;
  label: string;
  href?: string;
};

type TabsProps = {
  items: TabItem[];
  value: string;
  onChange?: (key: string) => void;
};

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex gap-2 rounded-3xl border border-gray-200 bg-white p-2">
      {items.map((item) => {
        const isActive = item.key === value;

        return (
          item.href ? (
            <Link
              key={item.key}
              href={item.href}
              className={[
                "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange?.(item.key)}
              className={[
                "whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black",
              ].join(" ")}
            >
              {item.label}
            </button>
          )
        );
      })}
    </div>
  );
}

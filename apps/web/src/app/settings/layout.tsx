"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
  label: "Сигналы",
  href: "/settings/signal",
  },

  {
  href: "/settings/ai-analysis",
  label: "AI-анализ",
  },
  {
    label: "Типы встреч",
    href: "/settings/meeting-types",
  },
  {
  href: "/settings/scripts",
  label: "Скрипты",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Настройки
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Управление логикой анализа, скорингом и типами встреч
        </p>
      </div>

      <div className="flex gap-2 rounded-3xl border border-gray-200 bg-white p-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "rounded-2xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-black",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
"use client";

import { usePathname } from "next/navigation";
import { Tabs } from "@/components/ui-tabs";

const tabs = [
  {
    key: "/settings/signal",
    label: "Сигналы",
    href: "/settings/signal",
  },
  {
    key: "/settings/ai-analysis",
    href: "/settings/ai-analysis",
    label: "AI-анализ",
  },
  {
    key: "/settings/meeting-types",
    label: "Типы встреч",
    href: "/settings/meeting-types",
  },
  {
    key: "/settings/scripts",
    href: "/settings/scripts",
    label: "Скрипты",
  },
  {
    key: "/settings/users",
    href: "/settings/users",
    label: "Пользователи",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activePath = pathname ?? "/settings/signal";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          Настройки
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Управление логикой анализа, сигналами и типами встреч
        </p>
      </div>

      <Tabs items={tabs} value={activePath} />

      {children}
    </div>
  );
}

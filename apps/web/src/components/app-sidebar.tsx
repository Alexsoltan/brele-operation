"use client";

import Link from "next/link";
import Image from "next/image";
import { BarChart3, BriefcaseBusiness, CalendarDays, FileText, Inbox, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Дашборд",
    href: "/",
    icon: BarChart3,
    activePaths: ["/"],
  },
  {
    label: "Проекты",
    href: "/projects",
    icon: BriefcaseBusiness,
    activePaths: ["/projects"],
  },
  {
    label: "Встречи",
    href: "/meetings",
    icon: CalendarDays,
    activePaths: ["/meetings"],
  },
  {
    label: "Типы встреч",
    href: "/meeting-types",
    icon: FileText,
    activePaths: ["/meeting-types"],
  },
  {
    label: "Импорт",
    href: "/import",
    icon: Inbox,
    activePaths: ["/import"],
  },
];

function isActivePath(pathname: string, item: (typeof navItems)[number]) {
  if (item.href === "/") {
    return pathname === "/";
  }

  return item.activePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white px-5 py-8">
      <div className="mb-10">
        <Image
          src="/logo.png"
          alt="Brele"
          width={92}
          height={44}
          priority
          className="h-auto w-[92px]"
        />
        <div className="mt-3 text-sm text-gray-500">операционная панель</div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          pathname.startsWith("/settings")
            ? "bg-black text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-black"
        }`}
      >
        <Settings size={18} />
        Настройки
      </Link>
    </aside>
  );
}
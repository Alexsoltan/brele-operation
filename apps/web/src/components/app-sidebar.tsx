"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Inbox,
  Settings,
} from "lucide-react";

const navItems = [
  {
    label: "Дашборд",
    href: "/",
    icon: BarChart3,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    label: "Проекты",
    href: "/projects",
    icon: BriefcaseBusiness,
    isActive: (pathname: string) => pathname.startsWith("/projects"),
  },
  {
    label: "Встречи",
    href: "/meetings",
    icon: CalendarDays,
    isActive: (pathname: string) => pathname.startsWith("/meetings"),
  },
  {
    label: "Типы встреч",
    href: "/meeting-types",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/meeting-types"),
  },
  {
    label: "Импорт",
    href: "/import",
    icon: Inbox,
    isActive: (pathname: string) => pathname.startsWith("/import"),
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="px-6 pb-6 pt-5">
        <Link href="/" className="block text-center leading-none">
          <img
            src="/logo.png"
            alt="Brele"
            className="mx-auto w-32 object-contain"
          />

          <div className="-mt-1 text-center font-body text-xs font-medium uppercase tracking-[0.22em] text-gray-400">
            operations
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-body text-sm font-medium transition",
                active
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black",
              ].join(" ")}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-7">
        <Link
          href="/settings"
          className={[
            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-body text-sm font-medium transition",
            pathname.startsWith("/settings")
              ? "bg-black text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-black",
          ].join(" ")}
        >
          <Settings size={17} />
          Настройки
        </Link>
      </div>
    </aside>
  );
}
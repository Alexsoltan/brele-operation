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
  { href: "/", label: "Дашборд", icon: BarChart3 },
  { href: "/projects", label: "Проекты", icon: BriefcaseBusiness },
  { href: "/meetings", label: "Встречи", icon: CalendarDays },
  { href: "/meeting-types", label: "Типы встреч", icon: FileText },
  { href: "/import", label: "Импорт", icon: Inbox },
];

export function AppSidebar() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      
      {/* LOGO BLOCK */}
      <div className="px-4 pb-12 pt-6">
  <Link href="/" className="block leading-none">
    <img
      src="/logo.png"
      alt="Brele"
      className="w-32 object-contain"
    />

    <div className="-mt-1 pl-3 font-body text-xs font-medium uppercase tracking-[0.22em] text-gray-400">
      Operations
    </div>
  </Link>
</div>

      {/* NAV */}
      <nav className="flex-1 space-y-1.5 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-body text-sm font-medium transition",
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black",
              ].join(" ")}
            >
              <Icon
                size={17}
                className={[
                  "shrink-0 transition",
                  isActive ? "text-white" : "text-gray-500 group-hover:text-black",
                ].join(" ")}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* SETTINGS */}
      <div className="px-4 pb-7">
        <Link
          href="/settings"
          className={[
            "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 font-body text-sm font-medium transition",
            pathname.startsWith("/settings")
              ? "bg-black text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100 hover:text-black",
          ].join(" ")}
        >
          <Settings
            size={17}
            className={[
              "shrink-0 transition",
              pathname.startsWith("/settings")
                ? "text-white"
                : "text-gray-500 group-hover:text-black",
            ].join(" ")}
          />

          <span>Настройки</span>
        </Link>
      </div>
    </aside>
  );
}
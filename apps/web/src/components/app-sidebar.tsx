"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  FileText,
  Upload,
  Settings,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Дашборд",
    icon: LayoutDashboard,
  },
  {
    href: "/projects",
    label: "Проекты",
    icon: FolderKanban,
  },
  {
    href: "/meetings",
    label: "Встречи",
    icon: CalendarDays,
  },
  {
    href: "/meeting-types",
    label: "Типы встреч",
    icon: FileText,
  },
  {
    href: "/import",
    label: "Импорт",
    icon: Upload,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4 text-center">
        <Link href="/" className="block">
          <img
            src="/logo.png"
            alt="Brele"
            className="mx-auto h-16 w-auto object-contain"
          />
          <div className="mt-1 text-[11px] tracking-[0.3em] text-gray-400 uppercase">
            Operations
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
            >
              <Icon
                size={17}
                className={`transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-black"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-black transition"
        >
          <Settings size={16} />
          Настройки
        </Link>
      </div>
    </aside>
  );
}
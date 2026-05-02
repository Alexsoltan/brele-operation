"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Inbox,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Дашборд", icon: BarChart3 },
  { href: "/projects", label: "Проекты", icon: BriefcaseBusiness },
  { href: "/meetings", label: "Встречи", icon: CalendarDays },
  { href: "/import", label: "Импорт", icon: Inbox },
];

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-60 flex-col bg-[#1f1f1f] py-5">
      <div className="pb-10 pl-8 pt-6">
        <Link href="/" className="block leading-none">
          <img
            src="/brele-logo-white.svg"
            alt="Brele"
            className="w-32 object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-3">
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
                "group flex items-center gap-3 rounded-full px-4 py-3 font-body text-sm font-medium transition",
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              <Icon
                size={18}
                className={[
                  "shrink-0 transition",
                  isActive
                    ? "text-black"
                    : "text-white/65 group-hover:text-white",
                ].join(" ")}
              />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 px-3 pt-5">
        <Link
          href="/settings"
          className={[
            "group flex items-center gap-3 rounded-full px-4 py-3 font-body text-sm font-medium transition",
            pathname.startsWith("/settings")
              ? "bg-white text-black shadow-sm"
              : "text-white/70 hover:bg-white/10 hover:text-white",
          ].join(" ")}
        >
          <Settings
            size={18}
            className={[
              "shrink-0 transition",
              pathname.startsWith("/settings")
                ? "text-black"
                : "text-white/65 group-hover:text-white",
            ].join(" ")}
          />

          <span>Настройки</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-full px-4 py-3 font-body text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut
            size={18}
            className="shrink-0 text-white/65 transition group-hover:text-white"
          />

          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
}
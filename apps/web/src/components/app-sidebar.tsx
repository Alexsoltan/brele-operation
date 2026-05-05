"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Inbox,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Дашборд", icon: BarChart3 },
  { href: "/projects", label: "Проекты", icon: BriefcaseBusiness },
  { href: "/meetings", label: "Встречи", icon: CalendarDays },
  { href: "/import", label: "Импорт встреч", icon: Inbox },
];

type CurrentUser = {
  id: string;
  email: string;
  name?: string | null;
};

function getInitials(user: CurrentUser | null) {
  if (!user) return "";

  const source = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const parts = source
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [importCount, setImportCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const initials = getInitials(currentUser);

  useEffect(() => {
    let isMounted = true;

    async function loadImportCount() {
      try {
        const response = await fetch("/api/import/meeting-drafts/count", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as { count?: number };

        if (isMounted) {
          setImportCount(data.count ?? 0);
        }
      } catch {
        if (isMounted) {
          setImportCount(0);
        }
      }
    }

    loadImportCount();
    const interval = window.setInterval(loadImportCount, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });

        if (!response.ok) return;

        const user = (await response.json()) as CurrentUser;

        if (isMounted) {
          setCurrentUser(user);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-[#1f1f1f] py-5">
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

              {item.href === "/import" && importCount > 0 ? (
                <span
                  className={[
                    "ml-auto min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-semibold",
                    isActive ? "bg-black text-white" : "bg-white text-black",
                  ].join(" ")}
                >
                  {importCount > 99 ? "99+" : importCount}
                </span>
              ) : null}
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
          className="group flex w-full items-center gap-3 rounded-full px-4 py-2.5 font-body text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut
            size={18}
            className="shrink-0 text-white/65 transition group-hover:text-white"
          />

          <span>Выйти</span>

          <span
            title={currentUser?.name ?? currentUser?.email ?? "Пользователь"}
            className={[
              "ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-body text-[13px] font-bold leading-none shadow-[0_0_0_1px_rgba(217,255,63,0.18),0_8px_24px_rgba(217,255,63,0.18)] transition group-hover:scale-[1.03]",
              initials
                ? "bg-[#d9ff3f] text-black"
                : "bg-white/10 text-transparent",
            ].join(" ")}
          >
            {initials}
          </span>
        </button>
      </div>
    </aside>
  );
}

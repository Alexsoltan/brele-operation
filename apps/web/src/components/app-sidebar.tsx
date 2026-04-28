import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Inbox,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Дашборд", href: "/", icon: BarChart3, active: true },
  { label: "Проекты", href: "/projects", icon: BriefcaseBusiness, active: false },
  { label: "Встречи", href: "/meetings", icon: CalendarDays, active: false },
  { label: "Типы встреч", href: "/meeting-types", icon: FileText, active: false },
  { label: "Импорт", href: "/import-inbox", icon: Inbox, active: false },
];

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col justify-between border-r border-gray-200 bg-white px-6 py-8">
      <div>
        {/* BRAND */}
        <div className="mb-10">
          <Image
            src="/logo.png"
            alt="Brele"
            width={120}
            height={40}
            priority
            className="h-auto w-28 object-contain"
          />

          <div className="mt-2 text-sm text-gray-500 tracking-tight">
            операционная панель
          </div>
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  item.active
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
      >
        <Settings size={18} strokeWidth={1.8} />
        <span>Настройки</span>
      </Link>
    </aside>
  );
}
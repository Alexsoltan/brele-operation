"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <AppSidebar />

      <main className="min-h-screen pl-72">
        <div className="min-h-screen p-2.5 pl-0">
          <div className="min-h-[calc(100vh-20px)] overflow-hidden rounded-[36px] bg-[#f3f3f1] px-8 py-8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
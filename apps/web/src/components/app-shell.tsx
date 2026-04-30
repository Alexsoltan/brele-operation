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

      <main className="h-screen overflow-hidden pl-72">
        <div className="h-full p-2.5 pl-0">
          <div className="h-full overflow-y-auto rounded-[36px] bg-[#f3f3f1] px-8 py-8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] scrollbar-none">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}